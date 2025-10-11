"use client";

import { useEffect, useState } from "react";
import { adminCredit } from "@/lib/wallet";
import { getAllUsers } from "@/lib/userApi";

async function getWalletByUserId(userId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/wallet/${userId}`);
  if (!res.ok) {
    console.warn(`⚠️ Pas de wallet pour ${userId}`);
    return null;
  }
  return res.json();
}

export default function AdminUserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [wallets, setWallets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);

        const walletData: Record<string, number> = {};
        await Promise.all(
          data.map(async (u: any) => {
            const wallet = await getWalletByUserId(u._id);
            walletData[u._id] = wallet ? wallet.balanceCents / 100 : 0;
          })
        );

        setWallets(walletData);
      } catch (err) {
        console.error("⚠️ Erreur chargement utilisateurs:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleCredit = async (userId: string) => {
    const amount = amounts[userId];
    if (!amount || amount <= 0) return alert("Montant invalide ⚠️");

    try {
      await adminCredit(userId, amount);
      alert(`✅ ${amount} TND crédité à l'utilisateur`);

      const wallet = await getWalletByUserId(userId);
      setWallets((prev) => ({
        ...prev,
        [userId]: wallet ? wallet.balanceCents / 100 : 0,
      }));
    } catch (err) {
      console.error("💥 Erreur crédit:", err);
      alert("Erreur lors du crédit ❌");
    }
  };

  return (
    <div className="bg-[#0d141f]/90 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-[0_0_25px_rgba(0,255,170,0.1)] text-white animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 mb-4">
        👑 Gestion des utilisateurs
      </h2>

      {loading ? (
        <p className="text-sm text-gray-400">Chargement en cours...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr className="text-emerald-400 border-b border-emerald-400/20">
                <th className="text-left py-2 px-2">Utilisateur</th>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">Rôle</th>
                <th className="text-left py-2 px-2">Solde</th>
                <th className="text-center py-2 px-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u._id}
                  className={`
                    border-b border-white/5 
                    hover:bg-emerald-500/5 
                    transition duration-300
                    ${idx % 2 === 0 ? "bg-white/5" : "bg-transparent"}
                  `}
                >
                  {/* 👤 Infos utilisateur */}
                  <td className="py-3 px-2 font-semibold">{u.username}</td>
                  <td className="py-3 px-2 text-white/70">{u.email}</td>
                  <td className="py-3 px-2 text-white/60 capitalize">{u.role}</td>

                  {/* 💰 Solde */}
                  <td className="py-3 px-2 text-emerald-300 font-medium">
                    {wallets[u._id]?.toFixed(2) ?? "0.00"} TND
                  </td>

                  {/* 🎯 Actions */}
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="Montant"
                        className="
                          w-24 rounded-md border border-white/10 bg-white/10
                          text-white text-sm px-2 py-1 outline-none
                          focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40
                          transition
                        "
                        onChange={(e) =>
                          setAmounts({
                            ...amounts,
                            [u._id]: parseFloat(e.target.value),
                          })
                        }
                      />

                      <button
                        onClick={() => handleCredit(u._id)}
                        className="
                          bg-emerald-500/90 hover:bg-emerald-400
                          text-black font-semibold text-xs sm:text-sm
                          rounded-md px-3 py-1.5 shadow-[0_0_10px_rgba(16,185,129,0.5)]
                          transition-all duration-300 hover:scale-105
                        "
                      >
                        💰 Créditer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
