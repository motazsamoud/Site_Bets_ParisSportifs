"use client";

import { create } from "zustand";

type WalletStore = {
  balance: number | null;
  currency: string;
  loading: boolean;
  fetchBalance: () => Promise<void>;
  faucet: (amount?: number) => Promise<void>;
  setBalance: (amount: number) => void;
};

export const useWalletStore = create<WalletStore>((set) => ({
  balance: null,
  currency: "TND",
  loading: false,

  setBalance: (amount) => set({ balance: amount }),

  /** 🔹 Récupère le solde du backend */
  fetchBalance: async () => {
    try {
      set({ loading: true });

      const base =
        process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${base}/api/wallet`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "demo-user",
        },
        cache: "no-store",
      });

      console.log("🧩 [Wallet] Response:", res.status);

      if (!res.ok) throw new Error(`Erreur serveur ${res.status}`);
      const data = await res.json();
      const balance = (data.balanceCents ?? 0) / 100;

      set({
        balance,
        currency: data.currency || "TND",
        loading: false,
      });

      console.log("✅ [Wallet] Solde mis à jour:", balance);
    } catch (err) {
      console.error("❌ [Wallet] Erreur fetchBalance:", err);
      set({ balance: 0, loading: false });
    }
  },

  /** 🔹 Faucet pour créditer du solde virtuel */
  faucet: async (amount = 1000000) => {
    try {
      const base =
        process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${base}/api/wallet/faucet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "demo-user",
        },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) throw new Error(`Erreur faucet (${res.status})`);
      const data = await res.json();
      const balance = (data.balanceCents ?? 0) / 100;

      set({
        balance,
        currency: data.currency || "TND",
      });

      console.log(`🪙 [Wallet] Faucet ajouté: ${amount} -> Nouveau solde ${balance}`);
    } catch (err) {
      console.error("❌ [Wallet] Erreur faucet:", err);
    }
  },
}));
