"use client";

import { useEffect, useState } from "react";
import { getWallet, faucetWallet } from "@/lib/wallet";
import { PlusCircle, RotateCw, Crown } from "lucide-react";
import { useUserStore } from "@/store/useUserStore"; // ✅ pour suivre l'état du user

export default function HeaderClient() {
  const { user } = useUserStore(); // 🔹 observe en direct les changements du store
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState("TND");
  const [loading, setLoading] = useState(true);

  /** 🔹 Charge ou recharge le wallet si un user est connecté */
  const loadWallet = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setBalance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getWallet();
      setBalance(data.balanceCents / 100);
      setCurrency(data.currency || "TND");
    } catch (err) {
      console.error("💥 Erreur chargement wallet:", err);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  /** 🧠 Effet principal :
   *  - charge au démarrage
   *  - recharge si le user change (login/logout)
   *  - recharge si un autre composant émet “wallet-updated”
   */
  useEffect(() => {
    loadWallet(); // charge au début et quand le user change

    const onWalletUpdate = () => loadWallet();
    window.addEventListener("wallet-updated", onWalletUpdate);

    return () => {
      window.removeEventListener("wallet-updated", onWalletUpdate);
    };
  }, [user]); // 👈 dès qu’un login/logout se produit, on recharge

  // 🔹 Afficher le panneau admin uniquement pour les admins
  const handlePanelAdmin = () => {
    window.dispatchEvent(new Event("toggleAdminPanel"));
  };

  // 🔹 Rechargement manuel
  const handleRefresh = async () => {
    await loadWallet();
  };

  // 🔹 Faucet (ajout virtuel d’argent)
  const handleFaucet = async () => {
    try {
      await faucetWallet();
      window.dispatchEvent(new CustomEvent("wallet-updated"));
    } catch (err) {
      console.error("⚠️ Erreur faucet:", err);
    }
  };

  return (
    <header className="flex justify-between items-center px-6 py-3 border-b border-white/10 bg-[#0e141c]">
      <h1 className="text-lg font-bold tracking-wide">⚽ Odds PWA</h1>

      <div className="flex items-center gap-3">
        {/* 🧭 Bouton admin — visible uniquement pour le rôle admin */}
        {user?.role === "admin" && (
          <button
            onClick={handlePanelAdmin}
            className="flex items-center gap-1 bg-yellow-500/20 hover:bg-yellow-500/30 px-3 py-1.5 rounded-lg text-sm transition"
          >
            <Crown size={14} className="text-yellow-400" />
            <span>Panel Admin</span>
          </button>
        )}

        {/* 💰 Solde utilisateur */}
        {loading ? (
          <span className="text-emerald-400 text-sm animate-pulse">Chargement...</span>
        ) : user ? (
          <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg text-sm">
            <span className="font-semibold text-emerald-400">
              {(balance ?? 0).toFixed(2)} {currency}
            </span>
          </span>
        ) : (
          <span className="text-gray-400 text-sm">Non connecté</span>
        )}

        {/* 🔄 Bouton de refresh manuel */}
        <button
          onClick={handleRefresh}
          title="Recharger le solde"
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm border border-white/10 hover:bg-white/5 transition"
        >
          <RotateCw size={14} className="text-emerald-400" />
        </button>

        
      </div>
    </header>
  );
}
