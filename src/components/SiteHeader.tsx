"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import {
  ChevronDown,
  LogIn,
  UserPlus,
  Clock,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { logoutUser } from "@/lib/userApi";
import { useUserStore } from "@/store/useUserStore"; // ✅ ajouté

const nav = [
  { href: "/sports", label: "PARIS SPORTIFS" },
  { href: "/live/football", label: "PARIS EN DIRECT" },
  { href: "/casino", label: "CASINO À SOUS" },
  { href: "/casino-live", label: "CASINO EN DIRECT" },
  { href: "/virtuals", label: "SPORTS VIRTUELS" },
  { href: "/games", label: "JEUX RAPIDES" },
  { href: "/crash", label: "JEUX DE CRASH" },
  { href: "/tournaments", label: "TOURNOI CASINO", badge: "NOUVELLE" },
  { href: "/promos", label: "PROMOTION" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, setUser, logout, loadFromStorage } = useUserStore(); // ✅ récupère le store
  const [menuOpen, setMenuOpen] = useState(false);

  /* 🔹 Synchronisation initiale avec localStorage */
  useEffect(() => {
    loadFromStorage();
  }, []);

  /* 🔹 Ferme le menu sur changement de page */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* 🔹 Déconnexion */
  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      console.warn("⚠️ Déconnexion locale uniquement");
    } finally {
      logout(); // ✅ supprime user/token dans le store + localStorage
      router.push("/");
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-500/10 bg-[#0a0f17]/95 backdrop-blur-md shadow-[0_0_25px_rgba(0,255,170,0.1)] transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* 🔰 Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:brightness-125 transition"
        >
          <Image src="/brand/logo.svg" alt="logo" width={34} height={34} />
          <span className="font-semibold text-white tracking-wide text-sm md:text-base">
            betwinners
          </span>
        </Link>

        {/* 📱 Bouton burger (mobile) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-white hover:text-emerald-400 transition"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* 🧭 Navigation desktop */}
        <nav className="hidden lg:flex items-center gap-2 flex-1 ml-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "px-3 py-2 rounded-md text-xs font-medium tracking-wide transition-all duration-200 hover:bg-emerald-500/10 hover:text-emerald-400",
                pathname?.startsWith(item.href)
                  ? "text-emerald-300"
                  : "text-white/80"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {item.label}
                {item.badge && (
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
                    {item.badge}
                  </span>
                )}
              </span>
            </Link>
          ))}

          {/* 🕓 Historique */}
          <Link
            href="/bets/history"
            className={clsx(
              "ml-4 px-3 py-2 rounded-md text-xs font-semibold tracking-wide flex items-center gap-1 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all",
              pathname?.startsWith("/bets/history")
                ? "text-emerald-300"
                : "text-white/80"
            )}
          >
            <Clock size={14} className="text-emerald-400" />
            Historique
          </Link>
        </nav>

        {/* 🎮 Actions utilisateur (desktop) */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <span className="text-xs text-emerald-300 font-medium">
                👋 {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-white/90 hover:bg-red-500/10 hover:text-red-400 transition"
              >
                <LogOut size={14} />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-white/90 hover:bg-white/5 hover:border-emerald-500/30 transition"
              >
                <LogIn size={14} className="text-emerald-400" />
                Connexion
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-black hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition"
              >
                <UserPlus size={14} />
                S’inscrire
              </Link>
            </>
          )}

          {/* Sélecteur langue */}
          <button className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-2 text-xs text-white/90 hover:bg-white/5 transition">
            FR <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* 📱 Menu mobile */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-white/10 bg-[#0a0f17]/95 backdrop-blur-md shadow-inner px-4 py-3 space-y-2 animate-in fade-in slide-in-from-top-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block px-3 py-2 rounded-md text-sm font-medium tracking-wide hover:bg-emerald-500/10 hover:text-emerald-400 transition-all",
                pathname?.startsWith(item.href)
                  ? "text-emerald-300 bg-emerald-500/5"
                  : "text-white/80"
              )}
            >
              {item.label}
            </Link>
          ))}

          {/* 🕓 Historique */}
          <Link
            href="/bets/history"
            className={clsx(
              "block px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-500/10 hover:text-emerald-400 transition-all",
              pathname?.startsWith("/bets/history")
                ? "text-emerald-300 bg-emerald-500/5"
                : "text-white/80"
            )}
          >
            Historique
          </Link>

          {/* 🎮 Actions utilisateur (mobile) */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            {user ? (
              <>
                <p className="text-xs text-emerald-300">👋 {user.username}</p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1 rounded-md border border-white/10 px-3 py-2 text-sm text-white/90 hover:bg-red-500/10 hover:text-red-400 transition"
                >
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block text-center rounded-md border border-white/10 px-3 py-2 text-sm text-white/90 hover:bg-white/5 transition"
                >
                  <LogIn size={14} className="inline mr-1 text-emerald-400" />
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="block text-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400 transition"
                >
                  <UserPlus size={14} className="inline mr-1" />
                  S’inscrire
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
