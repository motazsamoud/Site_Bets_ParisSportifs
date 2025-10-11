"use client";

import Image from "next/image";
import Link from "next/link";

const cols = {
  CONTENU: ["À propos", "Contact", "Conditions générales"],
  SPORTS: ["Paris en direct", "Paris sportifs", "Statistiques"],
  JEUX: ["Machines à sous", "Casino en direct", "Sports virtuels"],
  "ASSISTANCE CENTRE": ["Centre d’aide", "FAQ", "Support 24/7"],
};

const brands = ["visa", "mastercard", "skrill", "neteller", "bitcoin"];

export default function SiteFooter() {
  return (
    <footer className="relative mt-20 bg-gradient-to-b from-[#0a0f17] via-[#070b12] to-[#05080d] border-t border-white/10 text-white overflow-hidden">
      {/* 🌌 Glow animation background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 py-14 space-y-12">
        {/* ===== Top grid with sections ===== */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 text-sm">
          {Object.entries(cols).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-emerald-400 font-semibold tracking-wide text-xs sm:text-sm uppercase">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-white/70 hover:text-emerald-300 transition-colors duration-200"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ===== Payment providers section ===== */}
        <div className="pt-10 border-t border-white/10">
          <div className="text-center mb-6 text-sm font-semibold text-emerald-400 uppercase tracking-wide">
            Fournisseurs et paiements sécurisés
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
            {brands.map((b) => (
              <div
                key={b}
                className="relative h-8 w-16 grayscale hover:grayscale-0 transition-transform duration-300 hover:scale-110"
              >
                <Image
                  src={`/brands/${b}.png`}
                  alt={b}
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ===== Bottom section ===== */}
        <div className="pt-8 border-t border-white/10 text-center space-y-2">
          <div className="text-xs text-white/60">
            © {new Date().getFullYear()}{" "}
            <span className="text-emerald-400 font-semibold">betwinners</span> — Tous droits réservés.
          </div>
          <p className="text-[11px] text-white/40">
            Jouez de manière responsable — Interdit aux mineurs 🚫
          </p>
          <div className="flex justify-center gap-3 mt-2">
            <Link
              href="#"
              className="text-[11px] text-white/50 hover:text-emerald-300 transition"
            >
              Politique de confidentialité
            </Link>
            <span className="text-white/30">•</span>
            <Link
              href="#"
              className="text-[11px] text-white/50 hover:text-emerald-300 transition"
            >
              Sécurité & RGPD
            </Link>
          </div>
        </div>
      </div>

      {/* ✨ Neon border line at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent blur-[1px]" />
    </footer>
  );
}
