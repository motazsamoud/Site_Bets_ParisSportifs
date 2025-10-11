"use client";

import Link from "next/link";
import { useGet } from "@/lib/swr";
import type { Sport } from "@/lib/types";
import {
  Target,
  Goal,
  Sword,
  Dice6,
  Medal,
  Trophy,
  Dumbbell,
  CircleDot,
  Gamepad2,
  Dribbble,
  Volleyball,
} from "lucide-react";
import { motion } from "framer-motion";

/* 🏆 Association slug → icône */
const iconBySlug: Record<string, React.ComponentType<any>> = {
  football: Goal,
  basketball: Dribbble,
  volleyball: Volleyball,
  tennis: Target,
  mma: Sword,
  boxing: Dumbbell,
  "ice-hockey": Trophy,
  esports: Gamepad2,
  "table-tennis": CircleDot,
  handball: Medal,
};

export default function SportsRail() {
  const { data } = useGet<Sport[]>("/sports");
  const list = (data ?? []).slice(0, 12);

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg sm:text-xl font-semibold text-emerald-400 tracking-wide">
          🏅 Parie par sport
        </h2>
        <Link
          href="/sports"
          className="text-xs sm:text-sm text-white/60 hover:text-emerald-300 transition"
        >
          Voir tout →
        </Link>
      </div>

      {/* 🧭 Rail scroll horizontal */}
      <div
        className="
          flex gap-3 sm:gap-4 
          overflow-x-auto no-scrollbar 
          pb-2 px-1 sm:px-0
          snap-x snap-mandatory
          scroll-smooth
        "
      >
        {list.map((s, idx) => {
          const Icon = iconBySlug[s.slug] ?? Dice6;
          return (
            <motion.div
              key={s.slug}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="snap-start"
            >
              <Link
                href={`/sports/${s.slug}/leagues`}
                className="
                  group relative flex flex-col items-center justify-center 
                  w-24 sm:w-28 md:w-32 shrink-0
                  rounded-2xl border border-white/10
                  bg-[#121826]/80 backdrop-blur-sm
                  px-3 py-4
                  text-center
                  transition-all duration-300 ease-out
                  hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:border-emerald-400/40
                "
              >
                {/* Glow animé */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-transparent blur-md" />

                {/* Icône */}
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-b from-white/10 to-black/20 shadow-inner group-hover:from-emerald-400/20 group-hover:to-emerald-600/10 transition-all duration-300">
                  <Icon
                    size={24}
                    className="text-emerald-400 group-hover:scale-110 group-hover:rotate-[6deg] transition-transform duration-300"
                  />
                </span>

                {/* Nom du sport */}
                <span className="relative z-10 mt-2 line-clamp-1 text-[11px] sm:text-xs font-medium text-white/90 group-hover:text-emerald-300 transition">
                  {s.name}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
