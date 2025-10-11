"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HeroCarousel from "@/components/HeroCarousel";
import SportsRail from "@/components/SportsRail";
import QuickTiles from "@/components/QuickTiles";
import ShowcaseGrid from "@/components/ShowcaseGrid";
import AdminUserList from "@/components/AdminUserList";
import { getWallet } from "../lib/wallet";

export default function HomePage() {
  const [wallet, setWallet] = useState<{ balanceCents: number; currency: string } | null>(null);
  const [user, setUser] = useState<{ id: string; username: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  /* 🔹 Gestion du user connecté */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        getWallet()
          .then((data) => setWallet(data))
          .catch((err) => console.error("⚠️ Erreur wallet:", err))
          .finally(() => setLoading(false));
      } else {
        setUser(null);
        setWallet(null);
        setLoading(false);
      }
    } catch (err) {
      console.error("💥 Erreur locale:", err);
      setUser(null);
      setWallet(null);
      setLoading(false);
    }
  }, []);

  /* 🔹 Écoute le toggle Admin */
  useEffect(() => {
    const handleToggleAdmin = () => setShowAdminPanel((prev) => !prev);
    window.addEventListener("toggleAdminPanel", handleToggleAdmin);
    return () => window.removeEventListener("toggleAdminPanel", handleToggleAdmin);
  }, []);

  /* 🔹 Données statiques */
  const topSlots = [
    { title: "Crash Duel X", cover: "https://images.unsplash.com/photo-1542751110-97427bbecf20", cta: "Jouer" },
    { title: "Balloon", cover: "https://images.unsplash.com/photo-1520975916090-3105956dac38", cta: "Jouer" },
    { title: "Foxy 20", cover: "https://images.unsplash.com/photo-1511512578047-dfb367046420", cta: "Jouer" },
    { title: "Wild Aztec", cover: "https://images.unsplash.com/photo-1520975661595-6453be3f7070", cta: "Jouer" },
  ];

  const liveCasino = [
    { title: "Auto Roulette Live", cover: "https://images.unsplash.com/photo-1544989164-31dc3c645987", cta: "Jouer" },
    { title: "Baccarat Live", cover: "https://images.unsplash.com/photo-1547658719-4e3b0c04f471", cta: "Jouer" },
    { title: "Casino Hold’em", cover: "https://images.unsplash.com/photo-1548081061-7a1b8830e9a7", cta: "Jouer" },
    { title: "Roulette Arabic", cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e", cta: "Jouer" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1018] text-white">
      {/* 🔝 Header */}
      <SiteHeader />

      <main
        className="
          flex-1
          w-full
          max-w-[1400px]
          mx-auto
          px-3 sm:px-4 md:px-6
          py-6 md:py-10
          space-y-10
          overflow-hidden
        "
      >
        {showAdminPanel ? (
          <AdminUserList />
        ) : (
          <>
            {/* 👤 Message utilisateur */}
            {user && !loading && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-right text-xs sm:text-sm text-emerald-400 font-medium pr-2"
              >
                Bienvenue,{" "}
                <span className="text-white font-semibold">{user.username}</span>
              </motion.div>
            )}

            {/* 🎰 Hero principal */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <HeroCarousel />
            </motion.div>

            {/* ⚽ Catégories de sport */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="w-full"
            >
              <SportsRail />
            </motion.section>

            {/* 🎯 Liens rapides */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="w-full"
            >
              <QuickTiles />
            </motion.section>

            {/* 🎰 Machines à sous */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="w-full"
            >
              <ShowcaseGrid
                title="🎰 Meilleurs jeux de machines à sous"
                items={topSlots}
                moreHref="/slots"
                moreCount={24}
              />
            </motion.section>

            {/* 🎥 Casino live */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="w-full"
            >
              <ShowcaseGrid
                title="🎥 Jeux de casino en direct"
                items={liveCasino}
                moreHref="/casino-live"
                moreCount={18}
              />
            </motion.section>
          </>
        )}
      </main>

      {/* 🔚 Footer */}
      <SiteFooter />
    </div>
  );
}
