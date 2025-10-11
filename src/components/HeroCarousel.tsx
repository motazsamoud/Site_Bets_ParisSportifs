"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  "https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80",
];

export default function HeroCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  // 🔁 Auto-slide avec pause au survol
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        rounded-2xl
        border border-white/10
        shadow-[0_0_25px_rgba(0,255,170,0.15)]
        select-none
        cursor-pointer
      "
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ✅ Responsive height */}
      <div className="relative aspect-[21/7] md:aspect-[21/6] sm:aspect-[21/9] min-h-[180px] sm:min-h-[220px] md:min-h-[300px]">
        <AnimatePresence initial={false}>
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 1.05, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1, x: -30 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={slides[i]}
              alt={`slide-${i}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1400px"
              className="object-cover transition-transform duration-1000 ease-out hover:scale-[1.02]"
            />
          </motion.div>
        </AnimatePresence>

        {/* 🎨 Dégradé sombre */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f17]/90 via-[#0a0f17]/40 to-transparent" />

        {/* 🧾 Texte overlay */}
        <div className="absolute bottom-6 left-6 sm:left-8 z-10 max-w-[80%]">
          <motion.h2
            key={`title-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl font-semibold text-white drop-shadow-md"
          >
            Cashback tous les jours 10%
          </motion.h2>
          <motion.p
            key={`subtitle-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs sm:text-sm md:text-base text-white/80"
          >
            Parie et gagne plus chaque jour
          </motion.p>
        </div>
      </div>

      {/* ⚪ Indicateurs (points) */}
      <div className="absolute bottom-4 right-6 flex gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              idx === i
                ? "bg-emerald-400 scale-110 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                : "bg-white/30 hover:bg-emerald-300/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
