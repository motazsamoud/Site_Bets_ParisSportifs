"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

type Card = { title: string; cover: string; cta?: string };
type Props = { title: string; items: Card[]; moreHref?: string; moreCount?: number };

export default function ShowcaseGrid({ title, items, moreHref, moreCount }: Props) {
  return (
    <section className="space-y-5 animate-fade-in">
      {/* 🔹 En-tête section */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg sm:text-xl font-semibold text-emerald-400 tracking-wide">
          {title}
        </h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="
              rounded-md border border-emerald-400/30 
              px-3 py-1 text-xs sm:text-sm text-white/80 
              hover:bg-emerald-400/10 hover:text-white 
              transition duration-300
            "
          >
            Afficher tout {moreCount ? `(${moreCount})` : ""}
          </Link>
        )}
      </div>

      {/* 🧱 Grille responsive (scroll horizontal sur mobile) */}
      <div
        className="
          grid gap-4 sm:gap-5
          grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 
          overflow-x-auto sm:overflow-visible 
          no-scrollbar scroll-smooth pb-2
        "
      >
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            className="
              group relative overflow-hidden rounded-2xl
              border border-white/10 
              bg-[#101623]/90 backdrop-blur-sm
              shadow-[0_0_15px_rgba(0,255,170,0.08)] 
              hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] 
              transition-all duration-500
              cursor-pointer
            "
          >
            {/* 🎬 Image principale */}
            <div className="relative aspect-[16/9] sm:aspect-[4/3] overflow-hidden">
              <Image
                src={it.cover}
                alt={it.title}
                fill
                priority={i < 2}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="
                  object-cover
                  transition-transform duration-700 ease-out 
                  group-hover:scale-110
                "
              />

              {/* 🎨 Dégradé foncé pour lisibilité */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f17]/90 via-transparent to-transparent" />

              {/* 🧾 Titre centré sur hover */}
              <div
                className="
                  absolute bottom-3 left-3 right-3
                  flex items-center justify-between
                  text-white text-sm font-medium
                  transition-all duration-500
                "
              >
                <span className="truncate group-hover:text-emerald-300">
                  {it.title}
                </span>
                {it.cta && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="
                      rounded-md bg-emerald-500/90 
                      px-3 py-1 text-xs font-semibold text-black 
                      hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] 
                      transition
                    "
                  >
                    {it.cta}
                  </motion.button>
                )}
              </div>
            </div>

            {/* ✨ Overlay subtil au survol */}
            <div
              className="
                absolute inset-0 
                bg-gradient-to-b from-emerald-400/10 to-transparent 
                opacity-0 group-hover:opacity-100 
                transition-opacity duration-500
              "
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
