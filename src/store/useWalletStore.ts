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

const BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  "https://odds-backend-fkh4.onrender.com";

/** Construit des headers valides pour fetch, sans unions bizarres */
function buildHeaders(json = true): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

export const useWalletStore = create<WalletStore>((set) => ({
  balance: null,
  currency: "TND",
  loading: false,

  setBalance: (amount) => set({ balance: amount }),

  /** 🔹 Récupère le solde (JWT requis côté backend) */
  fetchBalance: async () => {
    try {
      set({ loading: true });

      const res = await fetch(`${BASE}/api/wallet`, {
        method: "GET",
        headers: buildHeaders(false), // pas besoin de content-type en GET
        cache: "no-store",
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Erreur serveur ${res.status}`);
      }

      const data = await res.json();
      set({
        balance: (data.balanceCents ?? 0) / 100,
        currency: data.currency || "TND",
        loading: false,
      });
    } catch (err) {
      console.error("❌ [Wallet] fetchBalance:", err);
      set({ loading: false });
    }
  },

  /** 🔹 Faucet de test (JWT requis) */
  faucet: async (amount = 1_000_000) => {
    try {
      const res = await fetch(`${BASE}/api/wallet/faucet`, {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Erreur faucet (${res.status})`);
      }

      const data = await res.json();
      set({
        balance: (data.balanceCents ?? 0) / 100,
        currency: data.currency || "TND",
      });
    } catch (err) {
      console.error("❌ [Wallet] faucet:", err);
    }
  },
}));
