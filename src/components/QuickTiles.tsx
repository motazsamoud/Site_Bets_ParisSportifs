"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gamepad2, Trophy, Tv, Coins } from "lucide-react";

const tiles = [
  {
    label: "SÉLECTIONNER SPORTS",
    href: "/sports",
    color: "from-cyan-400/20 to-cyan-600/10",
    icon: Tv,
  },
  {
    label: "PRÉ SPORTS",
    href: "/sports",
    color: "from-emerald-400/20 to-emerald-600/10",
    icon: Trophy,
  },
  {
    label: "CASINO EN DIRECT",
    href: "/casino-live",
    color: "from-pink-400/20 to-pink-600/10",
    icon: Gamepad2,
  },
  {
    label: "EMPLACEMENT CASINO",
    href: "/casino",
    color: "from-violet-400/20 to-violet-600/10",
    icon: Coins,
  },
];

export default function QuickTiles() {
  return (
    <section
      className="
        grid 
        grid-cols-2 sm:grid-cols-2 md:grid-cols-4 
        gap-3 sm:gap-4 
        w-full 
        animate-fade-in
      "
    >
      {tiles.map((t, idx) => {
        const Icon = t.icon;
        return (
          <motion.div
            key={`${t.href}-${idx}`}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={t.href}
              className={`
                group relative block overflow-hidden
                rounded-2xl
                border border-white/10
                bg-gradient-to-br ${t.color}
                px-4 sm:px-5 py-8 sm:py-10
                text-center text-[12px] sm:text-sm md:text-base font-semibold tracking-wide
                transition-all duration-300 ease-out
                hover:-translate-y-1 hover:shadow-[0_0_18px_rgba(16,185,129,0.4)]
              `}
            >
              {/* 🔆 Glow animé */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-emerald-400/10 via-transparent to-emerald-500/5 blur-md" />

              {/* 🎮 Icône centrale */}
              <div className="relative mb-3 flex justify-center">
                <span
                  className="
                    flex items-center justify-center
                    h-12 w-12 sm:h-14 sm:w-14
                    rounded-full bg-white/5
                    backdrop-blur-md
                    shadow-inner
                    border border-white/10
                    group-hover:bg-emerald-400/20
                    transition-all duration-300
                  "
                >
                  <Icon
                    size={26}
                    className="
                      text-emerald-400 
                      group-hover:scale-110 group-hover:rotate-[8deg]
                      transition-transform duration-300
                    "
                  />
                </span>
              </div>

              {/* 🏷️ Label */}
              <div className="relative z-10 text-white group-hover:text-emerald-300 transition-colors">
                {t.label}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </section>
  );
}
