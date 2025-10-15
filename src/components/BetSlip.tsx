"use client";

import { useBetStore } from "@/store/useBetStore";
import { useWalletStore } from "@/store/useWalletStore";
import { useUserStore } from "@/store/useUserStore";
import { useState, useMemo, useEffect } from "react";

/**
 * 🎫 Feuille de pari (BetSlip)
 * ➜ Récupère automatiquement l'utilisateur connecté (JWT)
 * ➜ Envoie le pari via Authorization: Bearer <token>
 * ➜ Met à jour le solde via wallet après succès
 */
export default function BetSlip() {
  const { slip, removeBet, clearSlip } = useBetStore();
  const { fetchBalance } = useWalletStore();
  const { user, token, loadFromStorage } = useUserStore();

  const [stake, setStake] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // ✅ Recharger les infos utilisateur à chaque montage
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // ✅ Calcul des cotes totales
  const totalOdds = useMemo(
    () => slip.reduce((acc, b) => acc * Number(b.odds || 1), 1),
    [slip]
  );

  // ✅ Calcul du revenu potentiel
  const potentialWin = stake > 0 ? stake * totalOdds : 0;

  // ✅ Base API
  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    "https://odds-backend-fkh4.onrender.com";

  /** 🔹 Placement du pari */
  async function handlePlace() {
    if (!user?.id || !token) {
      return alert("Veuillez vous connecter avant de placer un pari !");
    }
    if (slip.length === 0) return alert("Aucun pari sélectionné !");
    if (stake <= 0) return alert("Veuillez entrer une mise valide !");
    setLoading(true);

    try {
      const body = {
        stake,
        selections: slip.map((b) => ({
          eventId: b.fixtureId,
          outcomeKey:
            b.selection === "1"
              ? "home"
              : b.selection === "X"
              ? "draw"
              : b.selection === "2"
              ? "away"
              : b.selection.toLowerCase(),
          market: b.market,
          price: Number(b.odds),
          label: `${b.selection} @ ${b.odds}`,
          home: b.event?.split(" vs ")[0] || "",
          away: b.event?.split(" vs ")[1] || "",
        })),
      };

      console.log("🎯 Envoi du pari :", body);

      const res = await fetch(`${API_BASE}/api/bets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      alert(
        `✅ Pari placé avec succès ! Gain potentiel : ${(data.potentialWinCents / 100).toFixed(2)} ${
          data.currency || "TND"
        }`
      );

      clearSlip();
      await fetchBalance();
    } catch (err: any) {
      console.error("❌ Erreur lors du placement du pari:", err);
      alert(err.message || "Erreur lors de la communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#111a24] border border-white/10 p-4 rounded-xl w-[320px]">
      <h2 className="text-lg font-semibold mb-3">🎫 Feuille de pari</h2>

      {slip.length === 0 ? (
        <p className="text-white/60 text-sm">Aucun pari ajouté</p>
      ) : (
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
          {slip.map((b, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-[#1a2432] px-3 py-2 rounded-lg"
            >
              <div>
                <div className="text-sm font-semibold">{b.event}</div>
                <div className="text-xs text-white/60">
                  {b.market} – {b.selection}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">{b.odds}</span>
                <button
                  onClick={() => removeBet(b.fixtureId, b.market)}
                  className="text-red-400 text-xs hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Montants */}
      <div className="mt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span>Total cotes :</span>
          <span className="font-semibold">{totalOdds.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm items-center">
          <span>Mise :</span>
          <input
            type="number"
            className="w-32 rounded-lg bg-[#1a2432] p-2 text-right text-white"
            placeholder="0.00"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span>Revenu possible :</span>
          <span className="text-emerald-400 font-semibold">
            {potentialWin.toFixed(2)} TND
          </span>
        </div>
      </div>

      {/* Bouton */}
      <button
        disabled={loading}
        onClick={handlePlace}
        className={`w-full mt-4 py-2 rounded-lg font-bold transition ${
          loading
            ? "bg-gray-600 text-gray-300"
            : "bg-emerald-500 hover:bg-emerald-600 text-white"
        }`}
      >
        {loading ? "Placement..." : "Placer le pari"}
      </button>
    </div>
  );
}
