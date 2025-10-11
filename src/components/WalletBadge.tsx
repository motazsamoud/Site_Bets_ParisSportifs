"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/store/useWalletStore";
import { Wallet } from "lucide-react";

export default function WalletBadge() {
  const { balance, currency, fetchBalance } = useWalletStore();

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10 text-sm text-white/90">
      <Wallet size={16} className="text-emerald-400" />
      <span>
        {balance !== null ? `${balance.toFixed(2)} ${currency}` : "Chargement..."}
      </span>
    </div>
  );
}
