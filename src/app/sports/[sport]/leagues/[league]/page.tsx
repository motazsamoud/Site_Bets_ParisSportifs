"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useGet } from "@/lib/swr";
import type { Event } from "@/lib/types";
import Link from "next/link";
import { fmtDate } from "@/lib/utils";

export default function EventsByLeaguePage() {
  const { sport, league } = useParams<{ sport: string; league: string }>();
  const sp = useSearchParams();
  const regions = sp.get("regions") || process.env.DEFAULT_REGION || "eu";
  const { data, error, isLoading } = useGet<Event[]>(
    `/events/${sport}/league/${league}`,
    { regions }
  );

  if (isLoading) return <p>Chargement…</p>;
  if (error) return <p>Erreur: {(error as any)?.message}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Matchs — {sport} / {league}
      </h1>
      <div className="space-y-2">
        {data?.map((ev) => (
          <Link
            key={ev.id}
            href={`/events/${ev.id}?regions=${regions}&markets=${process.env.DEFAULT_MARKETS || "H2H"}`}
            className="block rounded-xl border p-4 bg-white hover:shadow"
          >
            <div className="text-sm text-neutral-500">{fmtDate(ev.date)} • {ev.status || "scheduled"}</div>
            <div className="text-lg font-medium">{ev.home} vs {ev.away}</div>
            <div className="text-xs text-neutral-500">{ev.league?.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
