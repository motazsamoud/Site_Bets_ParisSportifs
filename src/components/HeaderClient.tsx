"use client";

import { useEffect, useState } from "react";
import { getWallet, faucetWallet } from "@/lib/wallet";
import { PlusCircle, RotateCw, Crown } from "lucide-react";

export default function HeaderClient() {
  const [user, setUser] = useState<{ id: string; username: string; role?: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState("TND");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setUser(null);
      setBalance(null);
      setLoading(false);
      return;
    }

    const parsed = JSON.parse(storedUser);
    setUser(parsed);

    const loadWallet = async () => {
      try {
        const data = await getWallet();
        setBalance(data.balanceCents / 100);
        setCurrency(data.currency);
      } catch (err) {
        console.error("💥 Erreur chargement wallet:", err);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  const handlePanelAdmin = () => {
    const event = new Event("toggleAdminPanel");
    window.dispatchEvent(event);
  };

  const handleRefresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getWallet();
      setBalance(data.balanceCents / 100);
      setCurrency(data.currency);
    } catch (err) {
      console.error("⚠️ Erreur refresh wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFaucet = async () => {
    try {
      await faucetWallet();
      await handleRefresh();
    } catch (err) {
      console.error("⚠️ Erreur faucet:", err);
    }
  };

  return (
    <header className="flex justify-between items-center px-6 py-3 border-b border-white/10 bg-[#0e141c]">
      <h1 className="text-lg font-bold tracking-wide">⚽ Odds PWA</h1>

      <div className="flex items-center gap-3">
        {user?.role === "admin" && (
          <button
            onClick={handlePanelAdmin}
            className="flex items-center gap-1 bg-yellow-500/20 hover:bg-yellow-500/30 px-3 py-1.5 rounded-lg text-sm transition"
          >
            <Crown size={14} className="text-yellow-400" />
            <span>Panel Admin</span>
          </button>
        )}

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
