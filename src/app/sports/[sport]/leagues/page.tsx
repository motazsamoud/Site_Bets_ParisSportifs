"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { RefObject } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowDown, Ticket } from "lucide-react";
import { useGet } from "@/lib/swr";
import type { League, Event } from "@/lib/types";
import { useMultiOddsSocket } from "@/app/hooks/useMultiOddsSocket";
import { useBetStore } from "@/store/useBetStore";
import BetSlip from "@/components/BetSlip";

/* ------------------------ Hook IO (scroll infini) ------------------------ */
function useIO(
  onHit: () => void,
  opts?: { rootMargin?: string; threshold?: number; cooldownMs?: number }
) {
  const ref = useRef<HTMLDivElement>(null);

  // 🔒 on ne ré-attache pas l'observer quand la fonction change
  const cbRef = useRef(onHit);
  useEffect(() => { cbRef.current = onHit; }, [onHit]);

  // anti-spam: empêche les déclenchements en rafale quand la sentinelle reste visible
  const lockRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        if (lockRef.current) return;

        lockRef.current = true;
        cbRef.current();

        // cool-down court pour éviter la boucle tant que la sentinelle reste à l'écran
        const ms = opts?.cooldownMs ?? 500;
        setTimeout(() => {
          lockRef.current = false;
        }, ms);
      },
      {
        rootMargin: opts?.rootMargin ?? "400px 0px",
        threshold: opts?.threshold ?? 0.1,
      }
    );

    io.observe(node);
    return () => io.disconnect();
  }, []); // ⬅️ PAS de dépendances → observer attaché une fois

  return ref;
}


/* ------------------------ helpers dates ------------------------ */
const toDate = (iso?: string) => (iso ? new Date(iso) : new Date());
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
function addDays(d: Date, n: number) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}
function fmtDay(iso?: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(toDate(iso));
  } catch {
    return iso || "";
  }
}

/* ------------------------ banners ------------------------ */
const BONUS_BANNERS = [
  "https://cdn.pixabay.com/photo/2017/07/31/11/21/bonus-2559790_1280.jpg",
  "https://cdn.pixabay.com/photo/2017/07/13/10/29/banner-2490397_1280.jpg",
  "https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&q=75&w=1600",
];

/* ------------------------ helpers odds ------------------------ */
type OddsCell = { price?: string; line?: string; updatedAt?: string };
type BuiltGrids = {
  h2h?: { home?: OddsCell; draw?: OddsCell; away?: OddsCell };
};

async function fetchOdds(eventId: string, qs: URLSearchParams) {
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "";
  const url = `${base}/api/odds/odds/${eventId}?${qs.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function buildGrids(data: any): BuiltGrids {
  const out: BuiltGrids = {};
  const byBk: Record<string, any[]> = data?.bookmakers ?? {};

  // Cherche un marché parmi plusieurs alias, en lowercase
  const marketsOf = (aliases: string[]) => {
    const al = aliases.map(a => String(a).trim().toLowerCase());
    for (const bk of Object.keys(byBk)) {
      const markets = byBk[bk] || [];
      const m = markets.find((x: any) =>
        al.includes(String(x?.name ?? "").trim().toLowerCase())
      );
      if (m?.odds?.length) {
        // Prend la première ligne d'odds qui a au moins un prix valide
        const oddsArr = Array.isArray(m.odds) ? m.odds : [m.odds];
        const row =
          oddsArr.find((o: any) =>
            [o?.home, o?.draw, o?.away].some((v) => v && v !== "N/A")
          ) ?? oddsArr[0];

        return { ...m, odds: [row] };
      }
    }
    return null;
  };

  // Ajoute un max d’alias connus pour 1X2 / Match Odds / Moneyline
  const mH2H = marketsOf([
    "H2H",
    "ML",
    "Match Odds",
    "Match Winner",
    "Moneyline",
    "1X2",
    "1x2",
    "match odds",
    "moneyline",
  ]);

  if (mH2H) {
    const o = mH2H.odds[0] || {};
    const toStr = (v: any) => (v == null ? undefined : String(v));
    out.h2h = {
      home: { price: toStr(o.home), updatedAt: mH2H.updatedAt },
      draw: { price: toStr(o.draw), updatedAt: mH2H.updatedAt },
      away: { price: toStr(o.away), updatedAt: mH2H.updatedAt },
    };
  }

  return out;
}


/* ------------------------ hook direction flèches ------------------------ */
function usePriceDirection(price?: string) {
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!price || price === "N/A") return;
    const numeric = parseFloat(price);
    if (!isNaN(numeric)) {
      if (lastPrice !== null) {
        if (numeric > lastPrice) setDirection("up");
        else if (numeric < lastPrice) setDirection("down");
      }
      setLastPrice(numeric);
      const t = setTimeout(() => setDirection(null), 8000);
      return () => clearTimeout(t);
    }
  }, [price]);

  return direction;
}

/* ------------------------ SECTION HEADER ------------------------ */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold tracking-wide uppercase bg-[#0e141c] text-white/70 border border-white/10 rounded-md">
      {title}
    </div>
  );
}

/* ======================== MATCH ROW ======================== */
function MatchRow({ ev, regions }: { ev: Event; regions: string }) {
  const [open, setOpen] = useState(false);
  const [grids, setGrids] = useState<BuiltGrids | null>(null);
  const { addBet, removeBet, slip } = useBetStore();

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    q.set("regions", regions || "eu");
    q.set("markets", "H2H,ML,Match Odds,1X2");
    return q;
  }, [regions]);

  // 🔁 fetch initial + auto refresh (live 5s, upcoming 60s)
  useEffect(() => {
    let stopped = false;

    async function poll() {
      try {
        const raw = await fetchOdds(String(ev.id), qs);
        if (!stopped) setGrids(buildGrids(raw));
      } catch {}
      if (!stopped) {
        const isLive = (ev.status || "").toLowerCase() === "live";
        setTimeout(poll, isLive ? 5000 : 60000);
      }
    }

    poll();
    return () => {
      stopped = true;
    };
  }, [ev.id, qs, ev.status]);

  // 🔁 WS update
  useMultiOddsSocket([String(ev.id)], (payload) => {
    if (String(payload.eventId) === String(ev.id) && payload.data?.h2h) {
      setGrids((g) => ({ ...g, h2h: payload.data.h2h }));
    }
  });

  const h2h = grids?.h2h;

  // flèches pour matchs live uniquement
  const isLive = (ev.status || "").toLowerCase() === "live";
  const dirHome = usePriceDirection(isLive ? h2h?.home?.price : undefined);
  const dirDraw = usePriceDirection(isLive ? h2h?.draw?.price : undefined);
  const dirAway = usePriceDirection(isLive ? h2h?.away?.price : undefined);

  // bouton pari
  const makeButton = (label: string, price?: string, dir?: "up" | "down" | null) => {
    const valid = price && price !== "N/A";
    const isSelected = slip.some(
      (b) => b.fixtureId === String(ev.id) && b.market === "1X2" && b.selection === label
    );

    const handleClick = () => {
      if (!valid) return;
      if (isSelected) removeBet(String(ev.id), "1X2");
      else
        addBet({
          fixtureId: String(ev.id),
          market: "1X2",
          selection: label,
          odds: Number(price),
          event: `${ev.home} vs ${ev.away}`,
        });
    };

    return (
      <button
        key={label}
        onClick={handleClick}
        disabled={!valid}
        className={`min-w-16 flex items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition
          ${
            valid
              ? isSelected
                ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                : "bg-white/10 hover:bg-white/15 text-white"
              : "bg-white/5 text-white/40 cursor-not-allowed"
          }
          ${dir === "up" ? "text-emerald-400" : ""}
          ${dir === "down" ? "text-red-400" : ""}
        `}
      >
        {valid ? price : "-"}
        {dir === "up" && <ArrowUp size={12} className="animate-bounce" />}
        {dir === "down" && <ArrowDown size={12} className="animate-bounce" />}
      </button>
    );
  };

  // ❗️N'affiche pas si pas de cotes
  if (!h2h?.home?.price && !h2h?.draw?.price && !h2h?.away?.price) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-2">
          {ev.league?.name && (
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
              {ev.league.name}
            </span>
          )}
          <span className="opacity-70">{fmtDay(ev.date)}</span>
        </div>
        {isLive && (
          <span className="inline-flex items-center gap-1 text-red-400">
            <span className="size-2 rounded-full bg-red-500 animate-pulse" /> LIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center rounded-lg bg-[#0f151e] border border-white/10 p-3 transition">
        <div className="min-w-0">
          <div className="truncate font-medium">{ev.home}</div>
          <div className="truncate text-white/70 text-sm">{ev.away}</div>
        </div>

        {makeButton("1", h2h?.home?.price, dirHome)}
        {makeButton("X", h2h?.draw?.price, dirDraw)}
        {makeButton("2", h2h?.away?.price, dirAway)}

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
        >
          {open ? "Fermer" : "Plus"}
        </button>
      </div>

      {open && (
        <div className="rounded-lg border border-white/10 bg-[#0c121a] p-3 text-xs text-white/60">
          <Link
            href={`/events/${ev.id}?regions=${regions}`}
            className="underline text-white/70 hover:text-white"
          >
            Voir tous les marchés →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ======================== PAGE PRINCIPALE ======================== */
export default function SportLeaguesPage() {
  const { sport } = useParams<{ sport: string }>();
  const sp = useSearchParams();
  const regions = sp.get("regions") || process.env.NEXT_PUBLIC_DEFAULT_REGION || "eu";

  const { data: leagues } = useGet<League[]>(`/leagues/${sport}`, { regions });
  const { data: events, isLoading, error } = useGet<Event[]>(`/events/${sport}`, { regions });

  const today = startOfDay(new Date());
  const tomorrow = startOfDay(addDays(new Date(), 1));
  const in7dEnd = addDays(today, 8);

  // garder uniquement live + upcoming (pas finished/canceled/postponed…)
  const groups = useMemo(() => {
    const raw = (events ?? []).slice().sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime());
    const allowed = new Set(["live", "not_started", "scheduled", "ns", "pre", "pending"]);
    const list = raw.filter((e) => allowed.has((e.status || "").toLowerCase()));
    const G = { today: [] as Event[], tomorrow: [] as Event[], next7: [] as Event[] };
    for (const ev of list) {
      const d = startOfDay(toDate(ev.date));
      if (isSameDay(d, today)) G.today.push(ev);
      else if (isSameDay(d, tomorrow)) G.tomorrow.push(ev);
      else if (d > tomorrow && d < in7dEnd) G.next7.push(ev);
    }
    return G;
  }, [events]);

  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const filterByLg = (arr: Event[]) =>
    activeLeague ? arr.filter((e) => e.league?.slug === activeLeague) : arr;

  // 🔽 pagination locale par section
  type SectionKey = "today" | "tomorrow" | "next7";
  const BATCH = 20;
  const [vis, setVis] = useState<Record<SectionKey, number>>({
    today: BATCH,
    tomorrow: BATCH,
    next7: BATCH,
  });
  const addMore = (k: SectionKey) => setVis((v) => ({ ...v, [k]: v[k] + BATCH }));

  const todayRef = useIO(() => addMore("today"));
  const tomorrowRef = useIO(() => addMore("tomorrow"));
  const next7Ref = useIO(() => addMore("next7"));

  type Section = {
    title: string;
    list: Event[];
    key: SectionKey;
    ref: React.RefObject<HTMLDivElement | null>;
  };

  const sections: Section[] = [
    { title: "AUJOURD’HUI", list: groups.today, key: "today", ref: todayRef },
{ title: "DEMAIN",      list: groups.tomorrow, key: "tomorrow", ref: tomorrowRef },
{ title: "À VENIR (7 JOURS)", list: groups.next7, key: "next7", ref: next7Ref },
];

  const banner = BONUS_BANNERS[Math.floor(Math.random() * BONUS_BANNERS.length)];
  const { slip } = useBetStore();
  const [showSlip, setShowSlip] = useState(true);

  return (
    <div className="min-h-screen bg-[#0b1018] text-white">
      <div className="relative w-full h-[180px] overflow-hidden border-b border-white/10">
        <img src={banner} alt="" className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0b1018]" />
        <div className="absolute bottom-3 left-4">
          <div className="text-xl md:text-2xl font-bold tracking-wide">
            Paris — {String(sport).toUpperCase()}
          </div>
          <div className="text-white/70 text-xs">Matchs live + à venir avec actualisation en temps réel ⚡</div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-3 py-5 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-4">
        {/* sidebar */}
        <aside className="rounded-xl bg-[#0e141c] border border-white/10 p-3 space-y-3">
          <SectionHeader title="LIGUES POPULAIRES" />
          <div className="space-y-1 max-h-[68vh] overflow-auto pr-1">
            {(leagues ?? []).map((l) => (
              <button
                key={l.slug}
                onClick={() => setActiveLeague((prev) => (prev === l.slug ? null : l.slug))}
                className={`w-full text-left px-3 py-2 rounded-md border transition ${
                  activeLeague === l.slug
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                }`}
              >
                <div className="truncate text-sm">{l.name}</div>
                <div className="truncate text-[11px] opacity-60 uppercase">{l.slug}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* colonne matchs */}
        <main className="space-y-6">
          {sections.map((g) => (
            <section key={g.title} className="space-y-4">
              <SectionHeader title={g.title} />
              {isLoading && <div className="text-white/70 text-sm">Chargement…</div>}
              {error && <div className="text-red-400 text-sm">Erreur: {(error as any)?.message}</div>}

              {!isLoading &&
                filterByLg(g.list)
                  .slice(0, vis[g.key]) // batch visible
                  .map((ev) => <MatchRow key={String(ev.id)} ev={ev} regions={regions} />)
              }

              {!isLoading && !filterByLg(g.list).length && (
                <div className="text-xs text-white/60">Aucun match trouvé.</div>
              )}

              {/* sentinelle IO pour charger la suite */}
              <div ref={g.ref} className="h-8" />
            </section>
          ))}
        </main>

        {/* coupon */}
        <aside className="rounded-xl bg-[#0e141c] border border-white/10 p-3">
          <SectionHeader title="PARI SLIP" />
          {slip.length === 0 ? (
            <div className="mt-3 h-64 rounded-md border border-dashed border-white/15 bg-white/5 flex items-center justify-center text-white/60 text-sm">
              Votre coupon de pari est vide
            </div>
          ) : (
            <div className="mt-3">
              <BetSlip />
            </div>
          )}
        </aside>
      </div>

      {/* mobile slip */}
      <button
        onClick={() => setShowSlip((s) => !s)}
        className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition z-50 lg:hidden"
      >
        <Ticket size={22} />
        {slip.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {slip.length}
          </span>
        )}
      </button>

      {showSlip && (
        <div className="fixed bottom-20 right-6 z-50 lg:hidden w-[320px]">
          <BetSlip  />
        </div>
      )}
    </div>
  );
}
