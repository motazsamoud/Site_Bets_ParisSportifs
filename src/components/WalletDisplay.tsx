"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { RefreshCw, Wallet, PlusCircle } from "lucide-react";

export default function WalletDisplay() {
  const { balance, currency, fetchBalance, faucet, loading } = useWalletStore();

  useEffect(() => {
    // charge le solde au démarrage
    fetchBalance();
  }, [fetchBalance]);

  return (
    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl text-sm">
      <Wallet size={18} className="text-emerald-400" />
      <div>
        <div className="font-semibold text-white">
          {loading
            ? "Chargement..."
            : balance !== null
            ? `${balance.toFixed(2)} ${currency}`
            : "0.00 TND"}
        </div>
        <div className="text-xs text-white/60">Solde virtuel</div>
      </div>

      <button
        onClick={fetchBalance}
        className="ml-3 bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"
        title="Actualiser le solde"
      >
        <RefreshCw size={14} />
      </button>

      <button
        onClick={() => faucet(1000000)}
        className="bg-emerald-500/20 hover:bg-emerald-500/30 p-2 rounded-lg transition"
        title="Ajouter 1 000 000"
      >
        <PlusCircle size={14} />
      </button>
    </div>
  );
}
