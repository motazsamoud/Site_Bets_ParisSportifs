"use client";

import { use, useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, Timer, Activity, Ticket, X } from "lucide-react";
import { useOddsSocket } from "@/app/hooks/useOddsSocket";
import { useBetStore } from "@/store/useBetStore";
import BetSlip from "@/components/BetSlip";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:3000";

/* ----------------------------- helpers ----------------------------- */
function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type MarketCell = { price?: string; line?: string; updatedAt?: string };
type Grid = {
  title: string;
  rows: { label: string; key: string }[];
  table: Record<string, Record<string, MarketCell>>;
  hasAny: boolean;
};

function first<T>(arr?: T[]): T | undefined {
  return Array.isArray(arr) && arr.length ? arr[0] : undefined;
}

/* ----------------------------- hook flèches dynamiques ----------------------------- */
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
      const t = setTimeout(() => setDirection(null), 9000);
      return () => clearTimeout(t);
    }
  }, [price]);

  return direction;
}

/* ----------------------------- grid builder ----------------------------- */
function buildGrid(
  data: any,
  marketNames: string[],
  kind: "1x2" | "spread" | "totals" | "dnb" | "double" | "btts",
  title: string,
  rows: { label: string; key: string }[]
): Grid {
  const table: Grid["table"] = {};
  let hasAny = false;

  const bks: string[] = Object.keys(data?.bookmakers ?? {});
  for (const bk of bks) {
    const markets = (data.bookmakers[bk] ?? []) as any[];
    const m =
      markets.find((m) => marketNames.includes((m?.name ?? "").trim())) ?? null;

    const out: Record<string, MarketCell> = {};
    if (m?.odds?.length) {
      const o = first<any>(m.odds);
      switch (kind) {
        case "1x2":
          out.home = { price: o?.home, updatedAt: m.updatedAt };
          out.draw = { price: o?.draw, updatedAt: m.updatedAt };
          out.away = { price: o?.away, updatedAt: m.updatedAt };
          break;
        case "dnb":
          out.home = { price: o?.home, updatedAt: m.updatedAt };
          out.away = { price: o?.away, updatedAt: m.updatedAt };
          break;
        case "spread":
          const line = o?.hdp != null ? String(o.hdp) : undefined;
          out.home = { price: o?.home, line, updatedAt: m.updatedAt };
          out.away = { price: o?.away, line, updatedAt: m.updatedAt };
          break;
        case "totals":
          const total = o?.hdp != null ? String(o.hdp) : undefined;
          out.over = { price: o?.over, line: total, updatedAt: m.updatedAt };
          out.under = { price: o?.under, line: total, updatedAt: m.updatedAt };
          break;
        case "double":
          out["1X"] = { price: o?.home_draw, updatedAt: m.updatedAt };
          out["12"] = { price: o?.home_away, updatedAt: m.updatedAt };
          out["X2"] = { price: o?.draw_away, updatedAt: m.updatedAt };
          break;
        case "btts":
          out["yes"] = { price: o?.yes, updatedAt: m.updatedAt };
          out["no"] = { price: o?.no, updatedAt: m.updatedAt };
          break;
      }
    }

    if (Object.values(out).some((c) => c?.price && c.price !== "N/A")) hasAny = true;
    table[bk] = out;
  }

  return { title, rows, table, hasAny };
}

/* ----------------------------- bouton cote connecté ----------------------------- */
function PriceBtn({
  price,
  line,
  fixtureId,
  event,
  market,
  selection,
}: {
  price?: string;
  line?: string;
  fixtureId: string;
  event: string;
  market: string;
  selection: string;
}) {
  const direction = usePriceDirection(price);
  const valid = price && price !== "N/A";
  const { addBet, removeBet, slip } = useBetStore();

  const isSelected = slip.some(
    (b) => b.fixtureId === fixtureId && b.market === market && b.selection === selection
  );

  const handleClick = () => {
  if (!valid) return;

  // 🧠 Vérifie si une cote de CE match est déjà dans la feuille
  const hasBetForThisMatch = slip.some((b) => b.fixtureId === fixtureId);

  if (isSelected) {
    // si on reclique sur la même → on la retire
    removeBet(fixtureId, market);
  } else if (hasBetForThisMatch) {
    // s’il y a déjà une cote pour ce match → on remplace
    removeBet(fixtureId, market);
    addBet({
      fixtureId,
      market,
      selection,
      odds: Number(price),
      event,
    });
  } else {
    // sinon on ajoute normalement
    addBet({
      fixtureId,
      market,
      selection,
      odds: Number(price),
      event,
    });
  }
};


  return (
    <button
      onClick={handleClick}
      disabled={!valid}
      className={`flex-1 flex flex-col items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition relative
        ${
          valid
            ? isSelected
              ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
              : "bg-white/10 hover:bg-white/15 text-white"
            : "bg-white/5 text-white/40 cursor-not-allowed"
        }
        ${direction === "up" ? "text-emerald-400" : ""}
        ${direction === "down" ? "text-red-400" : ""}
      `}
      title={line ? `Ligne ${line}` : undefined}
    >
      <div className="flex items-center gap-1">
        {valid ? price : "-"}
        {direction === "up" && <ArrowUp size={12} className="animate-bounce" />}
        {direction === "down" && <ArrowDown size={12} className="animate-bounce" />}
      </div>
      {line && <div className="text-[10px] text-white/60">{line}</div>}
    </button>
  );
}

/* ----------------------------- HEADER LIVE STICKY ----------------------------- */
function LiveHeader({
  home,
  away,
  score,
  minute,
  possession,
}: {
  home: string;
  away: string;
  score?: string;
  minute?: number;
  possession?: { home: number; away: number };
}) {
  return (
    <div className="sticky top-0 z-50 backdrop-blur-md bg-[#0b1018]/80 border-b border-white/10 flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3 text-white">
        <span className="font-semibold">{home}</span>
        <div className="text-xl font-bold text-emerald-400">{score || "0 - 0"}</div>
        <span className="font-semibold">{away}</span>
      </div>

      <div className="flex items-center gap-4 text-sm text-white/70">
        {minute !== undefined && (
          <div className="flex items-center gap-1">
            <Timer size={14} />
            <span>{minute}'</span>
          </div>
        )}
        {possession && (
          <div className="flex items-center gap-1">
            <Activity size={14} />
            <span>{possession.home}% / {possession.away}%</span>
          </div>
        )}
        <span className="text-red-400 font-semibold animate-pulse">LIVE</span>
      </div>
    </div>
  );
}

/* ----------------------------- PAGE PRINCIPALE ----------------------------- */
export default function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ regions?: string; markets?: string }>;
}) {
  const { id } = use(params);
  const sp = use(searchParams);
  const regions = sp?.regions || "eu";
  const markets =
    sp?.markets ||
    "H2H,Spread,Totals,DrawNoBet,Double Chance,BothTeamsToScore,Over/Under";

  const { slip, removeBet } = useBetStore();
  const [showSlip, setShowSlip] = useState(false);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [liveStats, setLiveStats] = useState({
    score: "0 - 0",
    minute: 0,
    possession: { home: 50, away: 50 },
  });

  const handleLiveUpdate = useCallback((newData: any) => {
    startTransition(() => {
      setData((prev: any) => ({
        ...prev,
        bookmakers: { ...prev.bookmakers, ...(newData?.bookmakers || {}) },
      }));
      if (newData?.stats) {
        setLiveStats((s) => ({
          ...s,
          score: newData.stats.score ?? s.score,
          minute: newData.stats.minute ?? s.minute,
          possession: newData.stats.possession ?? s.possession,
        }));
      }
    });
  }, []);

  useOddsSocket(id, handleLiveUpdate);

  useEffect(() => {
    document.title = "Cotes du match";
    let stopped = false;

    async function fetchOdds() {
      try {
        const qs = new URLSearchParams({ regions, markets });
        const res = await fetch(`${API_BASE}/api/odds/odds/${id}?${qs.toString()}`);
        const json = await res.json();
        if (!stopped) setData(json);
      } catch (err) {
        console.error("Erreur fetch odds:", err);
      } finally {
        if (!stopped) setLoading(false);
        if (!stopped) setTimeout(fetchOdds, 5000);
      }
    }

    fetchOdds();
    return () => {
      stopped = true;
    };
  }, [id, regions, markets]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1018] text-white">
        Chargement des cotes…
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1018] text-red-400">
        Erreur : aucune donnée trouvée
      </div>
    );

  const bks: string[] = Object.keys(data?.bookmakers ?? {});
  const isLive = (data?.status ?? "").toLowerCase() === "live";
  const banner =
    "https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&q=75&w=1600";

  const grids = [
    buildGrid(data, ["ML", "H2H", "Match Odds", "1X2"], "1x2", "Résultat du match (1X2)", [
      { label: "1", key: "home" },
      { label: "X", key: "draw" },
      { label: "2", key: "away" },
    ]),
    buildGrid(data, ["Spread", "Handicap", "Asian Handicap"], "spread", "Handicap (principale)", [
      { label: "1 (Handicap)", key: "home" },
      { label: "2 (Handicap)", key: "away" },
    ]),
    buildGrid(data, ["Totals", "Over/Under", "Goals Totals"], "totals", "Total de buts (O/U)", [
      { label: "Plus", key: "over" },
      { label: "Moins", key: "under" },
    ]),
    buildGrid(data, ["Draw No Bet", "DNB"], "dnb", "Draw No Bet", [
      { label: "1 (DNB)", key: "home" },
      { label: "2 (DNB)", key: "away" },
    ]),
    buildGrid(data, ["Double Chance", "DC"], "double", "Double Chance", [
      { label: "1X", key: "1X" },
      { label: "12", key: "12" },
      { label: "X2", key: "X2" },
    ]),
    buildGrid(data, ["Both Teams To Score", "BTTS", "GG/NG"], "btts", "Both Teams To Score (GG/NG)", [
      { label: "Oui (GG)", key: "yes" },
      { label: "Non (NG)", key: "no" },
    ]),
  ].filter((g) => g.hasAny);

  /* ----------------------------- RENDER ----------------------------- */
  return (
    <div className="min-h-screen bg-[#0b1018] text-white flex flex-col relative">
      {isLive && (
        <LiveHeader
          home={data?.home}
          away={data?.away}
          score={liveStats.score}
          minute={liveStats.minute}
          possession={liveStats.possession}
        />
      )}

      <div className="relative w-full h-[200px] overflow-hidden border-b border-white/10">
        <img src={banner} alt="" className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0b1018]" />
        <div className="absolute bottom-4 left-6">
          <div className="text-2xl font-bold">
            {data?.home} <span className="text-gray-400">vs</span> {data?.away}
          </div>
          <div className="text-sm text-white/70">
            {fmtDate(data?.date)} — {data?.league?.name}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl p-6 space-y-6 pb-32">
        {grids.length > 0 ? (
          grids.map((grid) => (
            <section
              key={grid.title}
              className="rounded-xl bg-[#0e141c] border border-white/10 p-4 space-y-3 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{grid.title}</h2>
                <div className="text-xs text-white/60">{bks.length} bookmakers</div>
              </div>

              <div className="space-y-3">
                {grid.rows.map((r) => (
                  <div
                    key={r.key}
                    className="flex items-center gap-2 bg-[#101720] border border-white/10 rounded-lg p-3"
                  >
                    <div className="w-24 text-sm font-medium">{r.label}</div>
                    <div className="flex flex-1 justify-end gap-2">
                      {bks.map((bk) => {
                        const cell = grid.table[bk]?.[r.key];
                        return (
                          <PriceBtn
                            key={bk}
                            price={cell?.price}
                            line={cell?.line}
                            fixtureId={data.id}
                            event={`${data.home} vs ${data.away}`}
                            market={grid.title}
                            selection={r.label}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-lg border border-white/10 bg-[#101720] p-4 text-white/70">
            Aucune cote disponible avec ces paramètres.
          </div>
        )}

        <div className="pt-4">
          <Link
            href="/sports/football/leagues"
            className="text-sm underline text-white/70 hover:text-white"
          >
            ← Retour aux matchs
          </Link>
        </div>
      </main>

      {/* 🎟️ Bouton flottant panier de paris */}
      <button
        onClick={() => setShowSlip((s) => !s)}
        className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition"
      >
        <Ticket size={22} />
        {slip.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {slip.length}
          </span>
        )}
      </button>

      {/* 🧾 Panneau feuille des paris */}
      {showSlip && (
<div className="fixed bottom-20 right-6 z-50">
    <BetSlip userId="demo-user" />          <h3 className="text-lg font-semibold mb-3 flex items-center justify-between">
           
          </h3>

         
        </div>
      )}
    </div>
  );
}
