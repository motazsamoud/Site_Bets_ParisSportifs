"use client";

import { motion } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useGet } from "@/lib/swr";
import type { Sport } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

export default function SportsPage() {
  const { data, error, isLoading } = useGet<Sport[]>("/sports");

  const filters = ["Aujourd’hui", "Demain", "Cette semaine", "À venir"];

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1018] text-gray-400">
        Chargement...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1018] text-red-500">
        Erreur : {(error as any)?.message}
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b1018] text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-7xl space-y-10 px-4 py-8">
        {/* 🎯 Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-white/10"
        >
          <Image
            src="/hero/bonus1.jpg"
            alt="Bonus Banner"
            width={1600}
            height={400}
            className="w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1018]/80 via-transparent to-transparent flex items-end p-6">
            <h1 className="text-2xl font-bold">💰 100% Bonus sur votre premier pari</h1>
          </div>
        </motion.div>

        {/* 🗓️ Filtres (Aujourd’hui / Demain / etc.) + LIVE */}
        <div className="flex justify-center gap-3 flex-wrap">
          {filters.map((f, i) => (
            <button
              key={f}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition ${
                i === 0
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              {f}
            </button>
          ))}

          {/* 🔴 Bouton LIVE */}
          <Link
            href="/live/football"
            className="px-5 py-2 rounded-md text-sm font-semibold flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white shadow-lg transition"
            title="Voir les matchs en direct"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE
          </Link>
        </div>

        {/* 🏆 Liste des Sports */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {data?.map((s) => (
            <Link
              key={s.slug}
              href={`/sports/${s.slug}/leagues`}
              className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-4 transition"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={`/sports-icons/${s.slug}.png`}
                  alt={s.name}
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    {s.slug}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* 🧾 Section "Votre Coupon" */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-white/10 bg-white/5 p-6 text-center"
        >
          <h2 className="text-lg font-semibold mb-2">🎟️ Votre coupon de pari</h2>
          <p className="text-gray-400 text-sm">
            Aucun pari en cours — commencez à parier sur vos matchs préférés !
          </p>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}
