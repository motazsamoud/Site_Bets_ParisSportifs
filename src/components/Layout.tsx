"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const nav = [
  { href: "/sports", label: "Sports" },
  { href: "/live/football", label: "Live" },
  { href: "/bookmakers", label: "Bookmakers" },
  { href: "/usage", label: "Usage" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link href="/" className="font-bold text-lg">Odds PWA</Link>
          <nav className="flex gap-4">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm hover:bg-neutral-100",
                  pathname?.startsWith(n.href) && "bg-neutral-900 text-white hover:bg-neutral-900"
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
