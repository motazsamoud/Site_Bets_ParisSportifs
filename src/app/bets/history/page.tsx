"use client";
/**
 * BetHistory PRO – page Next.js ultra-complète
 * ---------------------------------------------------------
 * - Tableau récapitulatif + cartes détaillées
 * - Filtres (statut, date), recherche, pagination
 * - Export CSV, refresh
 * - Statuts couleurs (won/lost/pending/void)
 * - Détails sélection: cote, marché, ligne, bookmaker, etc.
 * - Live (minute, score) via /api/live/:fixtureId (lazy)
 * - Typage light pour s’adapter à tes schémas actuels
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Search,
  Calendar,
  Filter,
  Info,
  ChevronLeft,
  ChevronRight,
  AlarmClock,
  Volleyball, // ✅ au lieu de BallFootball
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore"; // ✅ Import du store user



/* ========================= Config ========================= */

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "https://odds-backend-fkh4.onrender.com";

/* ========================= Types ========================= */

type BetStatus = "pending" | "won" | "lost" | "void";

type Selection = {
  fixtureId?: string;
  home?: string;
  away?: string;
  market: string;
  outcomeKey: string;
  price: number;
  line?: string;
  bookmaker?: string;
  kickoffAt?: string;
  finalScore?: string;
  goalsHome?: number;
  goalsAway?: number;
  status?: BetStatus;

  // 🆕 champs ajoutés pour affichage live
  minute?: number | null; // minute du match
  isLive?: boolean;       // vrai si le match est en cours
};


type Bet = {
  _id: string;
  userId: string;
  selections: Selection[];
  stakeCents: number;
  combinedOdds: number;
  potentialWinCents: number;
  status: BetStatus;
  createdAt: string;
  updatedAt?: string;
  currency?: string; // si tu l’ajoutes (sinon "USD" par défaut)
};

/* ========================= Utils ========================= */

const fmtMoney = (n: number, cur = "USD") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 2,
  }).format(n);

const fmtDateTime = (iso?: string) => {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const cls = (...arr: Array<string | false | null | undefined>) =>
  arr.filter(Boolean).join(" ");

const statusColor = (s: BetStatus) =>
  s === "won"
    ? "text-green-400 bg-green-400/10 border-green-500/30"
    : s === "lost"
    ? "text-red-400 bg-red-400/10 border-red-500/30"
    : s === "void"
    ? "text-slate-300 bg-slate-300/10 border-slate-400/30"
    : "text-yellow-400 bg-yellow-400/10 border-yellow-500/30";

const statusLabel = (s: BetStatus) =>
  s === "won" ? "GAGNÉ" : s === "lost" ? "PERDU" : s === "void" ? "ANNULÉ" : "EN ATTENTE";

const toCents = (units: number) => Math.round(units * 100);
const fromCents = (cents: number) => (cents ?? 0) / 100;
// évalue le statut d’une cote selon le résultat
// 🧠 Nouveau : calcule statut selon score + ajoute gestion LIVE


// 🟥🟢🟡 Petit badge dynamique pour matchs LIVE
function LiveBadge({ minute }: { minute?: number }) {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-600/20 text-red-400 px-2 py-0.5 text-[11px] font-semibold animate-pulse">
      🔥 LIVE {minute ? `${minute}'` : ""}
    </span>
  );
}


// calcule statut global à partir des sélections (si le backend n’envoie pas déjà)
const computeGlobalStatus = (selections: Selection[]): BetStatus => {
  const hasLost = selections.some((s) => s.status === "lost");
  if (hasLost) return "lost";
  const allWon = selections.length > 0 && selections.every((s) => s.status === "won");
  if (allWon) return "won";
  const allVoid = selections.length > 0 && selections.every((s) => s.status === "void");
  if (allVoid) return "void";
  return "pending";
};

// pour export CSV
const csvEscape = (x: any) =>
  `"${String(x ?? "").replaceAll('"', '""').replaceAll("\n", " ")}"`;

/* ========================= Widgets ========================= */

function StatusPill({ status }: { status: BetStatus }) {
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        statusColor(status)
      )}
    >
      ● {statusLabel(status)}
    </span>
  );
}

function TinyBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/70">
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-xs">
      <div className="text-white/50">{label}</div>
      <div className="font-semibold">{children}</div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse bg-[#111a24] border border-white/10 rounded-xl p-4 mb-3">
      <div className="h-4 w-1/3 bg-white/10 rounded mb-2" />
      <div className="h-3 w-1/2 bg-white/10 rounded" />
    </div>
  );
}

/* ========================= Fetch helpers ========================= */

// charge l’historique pari
// charge l’historique pari pour le user connecté
async function fetchHistory(userId: string): Promise<Bet[]> {
  if (!userId) throw new Error("Utilisateur non connecté");
  const res = await fetch(`${API_BASE}/api/bets/history/${userId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ✅ Met à jour un pari terminé dans la base (backend)
async function saveBetToBackend(bet: Bet) {
  try {
    const res = await fetch(`${API_BASE}/api/bets/${bet._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: bet.status,
        selections: bet.selections,
        updatedAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    console.log(`💾 Bet #${bet._id} sauvegardé (${bet.status})`);
  } catch (err) {
    console.error("❌ Erreur sauvegarde du pari :", err);
  }
}


// charge (lazy) les infos live d’une sélection (si tu les exposes)
async function fetchLive(fixtureId: string) {
  // /api/live/:fixtureId (ton backend l’a)
  const res = await fetch(`${API_BASE}/api/live/${fixtureId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
// ✅ Nouvelle fonction : récupère les résultats finaux des matchs terminés
async function fetchFinishedMatches() {
  const res = await fetch(`${API_BASE}/api/odds/events/football?regions=eu`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function fetchAllMatches() {
  const res = await fetch(`${API_BASE}/api/odds/events/football?regions=eu`, {
   cache: "no-store",});
   if (!res.ok) throw new Error(await res.text());
   return res.json();
  }


/* ========================= Page ========================= */

export default function BetHistoryPage({ userId = "demo-user" }: { userId?: string }) {
  const [rows, setRows] = useState<Bet[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | BetStatus>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const currency = "USD";

  // refresh
   async function load() {
    try {
      setError(null);
      setRows(null);

      // 🧠 on récupère le user connecté depuis Zustand
      const storedUser = useUserStore.getState().user;
      if (!storedUser?.id) {
        console.warn("⚠️ Aucun utilisateur connecté, pas d'historique à charger.");
        setRows([]);
        return;
      }

      console.log(`📥 Chargement historique pour userId = ${storedUser.id}`);
      const data = await fetchHistory(storedUser.id);

      const allMatches = await fetchAllMatches();
      data.forEach((bet) => {
        bet.selections.forEach((sel) => {
          const match = allMatches.find((m: any) => {
            const sameTeams =
              m.home?.toLowerCase().includes(sel.home?.toLowerCase() || "") &&
              m.away?.toLowerCase().includes(sel.away?.toLowerCase() || "");
            return sameTeams || String(m.id) === String(sel.fixtureId);
          });
          if (match?.date) {
            sel.kickoffAt = match.date;
          }
        });
      });

      // recalcul si besoin
      const normalized: Bet[] = data.map((b) => {
        if (["won", "lost", "void"].includes(b.status)) return b;
        const sel = (b.selections || []).map((s) => ({
          ...s,
          status: evaluateSelection(s),
        }));
        const gl = (b.status ?? computeGlobalStatus(sel)) as BetStatus;
        return { ...b, selections: sel, status: gl, currency: b.currency ?? "TND" };
      });

      setRows(normalized);
    } catch (e: any) {
      console.error("❌ Erreur chargement historique :", e);
      setError(e?.message ?? "Erreur de chargement");
      setRows([]);
    }
  }


    useEffect(() => {
    const { user } = useUserStore.getState();
    if (user?.id) load();
    else setRows([]);
  }, [useUserStore.getState().user]);

  // 🔁 Met à jour immédiatement les scores terminés au chargement initial
useEffect(() => {
  if (rows && rows.length > 0) {
    updateFinishedMatches();
  }
}, [rows]);

// 🧠 Rafraîchissement des cotes LIVE toutes les 20 secondes
// 🧠 Rafraîchissement des résultats des matchs terminés toutes les 20 secondes

////////////////////////////////////////

  // filtres
  const filtered = useMemo(() => {
    if (!rows) return [];
    let arr = rows.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (status !== "all") {
      arr = arr.filter((b) => b.status === status);
    }
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      arr = arr.filter((b) => {
        const head =
          b._id +
          " " +
          b.selections.map((s) => [s.home, s.away, s.market, s.outcomeKey, s.bookmaker].join(" ")).join(" ");
        return head.toLowerCase().includes(qq);
      });
    }
    if (dateFrom) {
      const ts = +new Date(dateFrom);
      arr = arr.filter((b) => +new Date(b.createdAt) >= ts);
    }
    if (dateTo) {
      const te = +new Date(dateTo) + 24 * 3600 * 1000 - 1;
      arr = arr.filter((b) => +new Date(b.createdAt) <= te);
    }
    return arr;
  }, [rows, status, q, dateFrom, dateTo]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount, page]);

  // export CSV
  function exportCSV() {
    if (!filtered.length) return;
    const header = [
      "betId",
      "createdAt",
      "stake",
      "combinedOdds",
      "potentialWin",
      "status",
      "sel.home",
      "sel.away",
      "sel.market",
      "sel.outcome",
      "sel.price",
      "sel.line",
      "sel.bookmaker",
      "sel.kickoff",
      "sel.finalScore",
      "sel.status",
    ];
    const lines: string[] = [header.join(",")];
    filtered.forEach((b) => {
      b.selections.forEach((s) => {
        lines.push(
          [
            b._id,
            fmtDateTime(b.createdAt),
            (fromCents(b.stakeCents)).toFixed(2),
            b.combinedOdds.toFixed(2),
            (fromCents(b.potentialWinCents)).toFixed(2),
            b.status,
            s.home ?? "",
            s.away ?? "",
            s.market,
            s.outcomeKey,
            s.price,
            s.line ?? "",
            s.bookmaker ?? "",
            s.kickoffAt ? fmtDateTime(s.kickoffAt) : "",
            s.finalScore ?? "",
            s.status ?? "",
          ]
            .map(csvEscape)
            .join(",")
        );
      });
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bets_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // lazy live loader for a bet selections
  async function ensureLiveFor(bet: Bet) {
  const promises = (bet.selections || []).map(async (s, i) => {
    if (!s.fixtureId) return null;
    try {
      const live = await fetchLive(s.fixtureId);
      return { idx: i, live };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  setRows((prev) => {
    if (!prev) return prev;
    const clone = prev.map((x) => ({ ...x, selections: x.selections.map((y) => ({ ...y })) }));
    const idxBet = clone.findIndex((x) => x._id === bet._id);
    if (idxBet === -1) return prev;
    results.forEach((r) => {
      if (!r) return;
      const sel = clone[idxBet].selections[r.idx];
      const lv = r.live || {};

      // update live info
      sel.finalScore = lv.score || sel.finalScore;
      sel.goalsHome = lv.goalsHome ?? sel.goalsHome;
      sel.goalsAway = lv.goalsAway ?? sel.goalsAway;
      sel.kickoffAt = lv.kickoffAt || sel.kickoffAt;
      sel.status = evaluateSelection(sel); // 🔁 recalcul statut
      sel.minute = lv.minute ?? lv.elapsed ?? null; // pour badge
      sel.isLive =
        lv.status?.short === "1H" ||
        lv.status?.short === "2H" ||
        lv.status?.short === "ET" ||
        lv.status?.short === "LIVE";
    });
    clone[idxBet].status = computeGlobalStatus(clone[idxBet].selections);
    return clone;
  });
}

// ✅ Met à jour les paris terminés selon les résultats du backend
// ✅ Mise à jour robuste : cherche par ID ou par noms d'équipes
async function updateFinishedMatches() {
  try {
    const finished = await fetchFinishedMatches();

    setRows((prev) => {
      if (!prev) return prev;

      const clone = prev.map((b) => ({ ...b, selections: b.selections.map((s) => ({ ...s })) }));

      for (const bet of clone) {
        for (const sel of bet.selections) {
          // 🔍 Recherche du match soit par id, soit par noms d’équipes (cas fixtureId manquant)
          const match = finished.find((m: any) => {
            const sameTeams =
              m.home?.toLowerCase().includes(sel.home?.toLowerCase() || "") &&
              m.away?.toLowerCase().includes(sel.away?.toLowerCase() || "");
            return sameTeams || String(m.id) === String(sel.fixtureId);
          });

          if (match && match.status === "settled") {
  sel.goalsHome = match.scores?.home ?? 0;
  sel.goalsAway = match.scores?.away ?? 0;
  sel.finalScore = `${match.scores?.home ?? 0} : ${match.scores?.away ?? 0}`;
  sel.status = evaluateSelection(sel);
 sel.kickoffAt = match.date ?? sel.kickoffAt;
}


        }

        // 🧠 Ne pas recalculer les bets déjà finalisés
if (["won", "lost", "void"].includes(bet.status)) continue;

// 🧩 Recalcul et sauvegarde seulement si changement
const newStatus = computeGlobalStatus(bet.selections);
if (newStatus !== bet.status && ["won", "lost"].includes(newStatus)) {
  bet.status = newStatus;
  saveBetToBackend(bet);
}


      }

      return clone;
    });
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour des matchs terminés :", err);
  }
}




  /* =============== UI: Header/Filtres/Actions =============== */

  return (
    <div className="min-h-screen bg-[#0b1018] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">📜 Historique des paris</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              title="Rafraîchir"
            >
              <RefreshCw size={16} /> Rafraîchir
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              title="Exporter en CSV"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0e141c] px-3 py-2">
            <Search size={16} className="text-white/50" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un match, un bookmaker, un marché…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0e141c] px-3 py-2">
            <Filter size={16} className="text-white/50" />
            <select
              className="bg-transparent outline-none text-sm flex-1"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="won">Gagné</option>
              <option value="lost">Perdu</option>
              <option value="void">Annulé</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0e141c] px-3 py-2">
            <Calendar size={16} className="text-white/50" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="bg-transparent outline-none text-sm"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0e141c] px-3 py-2">
            <Calendar size={16} className="text-white/50" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="bg-transparent outline-none text-sm"
            />
          </div>
          <div className="md:col-span-1 flex items-center justify-end">
            <Link
              href="/sports"
              className="text-sm underline text-white/70 hover:text-white"
              title="Retour aux sports"
            >
              ← Sports
            </Link>
          </div>
        </div>

        {/* Erreur / chargement */}
        {!rows && !error && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-4">
            {error}
          </div>
        )}

        {/* Tableau récapitulatif */}
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#111a24]">
          <table className="w-full text-sm">
            <thead className="bg-[#1a2432] text-white/80 uppercase text-xs border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left">Date/Heure</th>
                <th className="px-4 py-3 text-left">Pari</th>
                <th className="px-4 py-3">Sélections</th>
                <th className="px-4 py-3 text-right">Mise</th>
                <th className="px-4 py-3 text-right">Cote totale</th>
                <th className="px-4 py-3 text-right">Gain potentiel</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((b) => {
                const cur = b.currency ?? currency;
                return (
                  <tr
                    key={b._id}
                    className="border-b border-white/10 hover:bg-[#1a2432]/70 transition"
                  >
                    <td className="px-4 py-3">{fmtDateTime(b.createdAt)}</td>
                    <td className="px-4 py-3 text-emerald-300 font-semibold">
                      #{b._id.slice(-6)}
                    </td>
                    <td className="px-4 py-3 text-center">
  {b.selections.length}
  {b.selections[0]?.kickoffAt && (
    <div className="text-[11px] text-white/50 mt-1">
      {fmtDateTime(b.selections[0].kickoffAt)}
    </div>
  )}
</td>

                    <td className="px-4 py-3 text-right">
                      {fmtMoney(fromCents(b.stakeCents), cur)}
                    </td>
                    <td className="px-4 py-3 text-right">{b.combinedOdds.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold">
                      {fmtMoney(fromCents(b.potentialWinCents), cur)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={async () => {
                          const willOpen = expanded !== b._id;
                          setExpanded(expanded === b._id ? null : b._id);
                          if (willOpen) {
                            
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/5"
                        title="Détails"
                      >
                        {expanded === b._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Détails
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!paged.length && rows && (
                <tr>
                  <td className="px-4 py-6 text-center text-white/60" colSpan={8}>
                    Aucun pari pour ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              <ChevronLeft size={16} /> Préc
            </button>
            <span className="text-white/70 text-sm">
              Page {page} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Suiv <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Détails (cartes) */}
        <div className="mt-8 space-y-6">
          {paged
            .filter((b) => expanded === b._id)
            .map((b) => {
              const cur = b.currency ?? currency;
              return (
                <div
                  key={b._id}
                  className="rounded-xl border border-white/10 bg-[#0e141c] p-4 shadow-lg"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">
                        Détails du pari <span className="text-emerald-300">#{b._id.slice(-6)}</span>
                      </h2>
                      <TinyBadge>{fmtDateTime(b.createdAt)}</TinyBadge>
                      <TinyBadge>{b.selections.length} sélections</TinyBadge>
                    </div>
                    <StatusPill status={b.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                    <Field label="Mise">
                      {fmtMoney(fromCents(b.stakeCents), cur)}
                    </Field>
                    <Field label="Cote totale">{b.combinedOdds.toFixed(2)}</Field>
                    <Field label="Gain potentiel" >
                      <span className="text-emerald-300">
                        {fmtMoney(fromCents(b.potentialWinCents), cur)}
                      </span>
                    </Field>
                    <Field label="Créé le">{fmtDateTime(b.createdAt)}</Field>
                    <Field label="Maj">{fmtDateTime(b.updatedAt)}</Field>
                    <Field label="Utilisateur">
                      <span className="text-white/70">{b.userId}</span>
                    </Field>
                  </div>

                  <div className="space-y-3">
                    {b.selections.map((s, i) => {
                      const selStatus = (s.status ?? "pending") as BetStatus;
                      const left =
                        s.kickoffAt ? (
                          <span title="Coup d’envoi" className="inline-flex items-center gap-1">
                            <AlarmClock size={14} className="text-white/50" />
                            {fmtDateTime(s.kickoffAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-white/60">
                            <Info size={14} /> Pas d’horaire
                          </span>
                        );

                      return (
                        <div
                          key={i}
                          className={cls(
                            "grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-lg border px-3 py-3",
                            selStatus === "won"
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : selStatus === "lost"
                              ? "border-red-500/40 bg-red-500/5"
                              : selStatus === "void"
                              ? "border-slate-400/40 bg-slate-500/5"
                              : "border-white/10 bg-[#101720]"
                          )}
                        >
                          {/* Match / équipes + date/heure */}
<div className="md:col-span-4 min-w-0">
  <div className="truncate font-semibold">
    {s.home ?? "?"} <span className="text-white/50">vs</span>{" "}
    {s.away ?? "?"}
  </div>

  {/* 🕓 Ajout de la date/heure du match si connue */}
  {s.kickoffAt ? (
    <div className="mt-1 text-xs text-white/60 flex items-center gap-1">
      <AlarmClock size={12} className="text-white/40" />
      {fmtDateTime(s.kickoffAt)}
    </div>
  ) : (
    <div className="mt-1 text-xs text-white/50 flex items-center gap-1">
      <Info size={12} className="text-white/40" /> Pas d’horaire
    </div>
  )}
</div>


                          {/* Marché / Sélection */}
                          <div className="md:col-span-3">
                            <div className="text-xs text-white/60">{s.market}</div>
                            <div className="font-semibold">
                              Sélection :{" "}
                              <span className="text-white/90">{s.outcomeKey}</span>
                              {s.line && (
                                <span className="ml-2 text-xs text-white/60">({s.line})</span>
                              )}
                            </div>
                          </div>

                          {/* Cote + Bookmaker */}
                          <div className="md:col-span-2">
                            <div className="text-xs text-white/60">Cote</div>
                            <div className="text-emerald-400 font-bold">{s.price}</div>
                            {s.bookmaker && (
                              <div className="text-[11px] text-white/60 mt-0.5">
                                {s.bookmaker}
                              </div>
                            )}
                          </div>

                          {/* Score / Statut sélection */}
                          <div className="md:col-span-3">
                            <div className="text-xs text-white/60">Score final</div>
                            <div className="font-semibold">
                              {s.finalScore ?? (s.goalsHome != null && s.goalsAway != null
                                ? `${s.goalsHome} : ${s.goalsAway}`
                                : "- / -")}
                            </div>
                            <div className="mt-1">
                              <StatusPill status={selStatus} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer bet */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <div className="text-xs text-white/60">
                      ID complet : <span className="text-white/80">{b._id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/live/football"
                        className="text-sm underline text-white/70 hover:text-white"
                      >
                        Voir les matchs en direct →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
function evaluateSelection(sel: {
  fixtureId?: string;
  home?: string;
  away?: string;
  market: string;
  outcomeKey: string;
  price: number;
  line?: string;
  bookmaker?: string;
  kickoffAt?: string;
  finalScore?: string;
  goalsHome?: number;
  goalsAway?: number;
  status?: BetStatus;
  minute?: number | null;
  isLive?: boolean;
}): BetStatus {
  if (!sel) return "pending";

  const home = Number(sel.goalsHome);
  const away = Number(sel.goalsAway);

  // pas de score → match pas encore fini
  if (isNaN(home) || isNaN(away)) return "pending";

  // marché 1X2
  if (sel.market.toLowerCase().includes("1x2") || sel.market.toLowerCase().includes("résultat")) {
    const winner = home > away ? "1" : away > home ? "2" : "X";
    return winner === sel.outcomeKey ? "won" : "lost";
  }

  // over/under
  if (sel.market.toLowerCase().includes("over") || sel.market.toLowerCase().includes("under")) {
    const total = home + away;
    const line = parseFloat(sel.line ?? "0");
    if (isNaN(line)) return "pending";
    return sel.market.toLowerCase().includes("over")
      ? total > line ? "won" : "lost"
      : total < line ? "won" : "lost";
  }

  // les deux équipes marquent
  if (sel.market.toLowerCase().includes("both") || sel.market.toLowerCase().includes("les deux")) {
    const both = home > 0 && away > 0;
    const expectYes = sel.outcomeKey.toLowerCase().includes("yes") || sel.outcomeKey.toLowerCase().includes("oui");
    return both === expectYes ? "won" : "lost";
  }

  return "pending";
}