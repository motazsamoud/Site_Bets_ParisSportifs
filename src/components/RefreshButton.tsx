"use client";

import { RefreshCw } from "lucide-react";
import { useWalletStore } from "@/store/useWalletStore";
import { useState } from "react";

export default function RefreshButton() {
  const { fetchBalance } = useWalletStore();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      console.log("🔄 [UI] Bouton Actualiser cliqué");
      setLoading(true);
      await fetchBalance();
      console.log("✅ [UI] Solde rafraîchi avec succès");
    } catch (err) {
      console.error("❌ [UI] Erreur lors du rafraîchissement:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      title="Actualiser le solde"
      disabled={loading}
      className={`flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition 
        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <RefreshCw
        size={14}
        className={`${loading ? "animate-spin text-emerald-400" : ""}`}
      />
    </button>
  );
}
