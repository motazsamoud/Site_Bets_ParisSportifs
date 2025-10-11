"use client";
import { create } from "zustand";

const BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:3000";

type Selection = {
  fixtureId: string;
  event: string;
  market: string;
  selection: string;
  price: number;
};

type BetSlipStore = {
  selections: Selection[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  addSelection: (s: Selection) => void;
  removeSelection: (fixtureId: string) => void;
  clear: () => void;
  setStake: (stake: number) => void;
  computeTotals: () => void;
  placeBet: () => Promise<void>;
};

export const useBetSlipStore = create<BetSlipStore>((set, get) => ({
  selections: [],
  stake: 0,
  totalOdds: 1,
  potentialWin: 0,

  addSelection: (s) => {
    const current = get().selections;
    const filtered = current.filter((x) => x.fixtureId !== s.fixtureId);
    set({ selections: [...filtered, s] });
    get().computeTotals();
  },

  removeSelection: (fixtureId) => {
    set({
      selections: get().selections.filter((s) => s.fixtureId !== fixtureId),
    });
    get().computeTotals();
  },

  clear: () => set({ selections: [], stake: 0, totalOdds: 1, potentialWin: 0 }),

  setStake: (stake) => {
    set({ stake });
    get().computeTotals();
  },

  computeTotals: () => {
    const { selections, stake } = get();
    const totalOdds = selections.reduce((acc, s) => acc * s.price, 1);
    const potentialWin = stake * totalOdds;
    set({ totalOdds, potentialWin });
  },

  /** 🔹 Envoi du pari vers le backend */
  placeBet: async () => {
    const { selections, stake } = get();
    if (selections.length === 0 || stake <= 0) {
      alert("Ajoutez des sélections et un montant valide.");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user?.id) {
        alert("Utilisateur non connecté.");
        return;
      }

      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE}/api/bets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          userId: user.id,
          stake,
          selections,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur backend: ${text}`);
      }

      const data = await res.json();
      console.log("✅ Pari validé:", data);
      alert(
        `✅ Pari créé avec succès ! Gain potentiel: ${(data.potentialWinCents / 100).toFixed(2)} ${data.currency}`
      );

      get().clear();
    } catch (err) {
      console.error("❌ Erreur lors du placement du pari:", err);
      alert("Erreur lors du placement du pari.");
    }
  },
}));
