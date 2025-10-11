"use client";
import { useGet } from "@/lib/swr";
import { get, api } from "@/lib/api";
import { useState } from "react";

type Bm = { name: string };

export default function BookmakersPage() {
  const { data, isLoading, error, mutate } = useGet<Bm[]>("/bookmakers");
  const { data: selected } = useGet<string[]>("/bookmakers/selected");
  const [saving, setSaving] = useState(false);

  if (isLoading) return <p>Chargement…</p>;
  if (error) return <p>Erreur: {(error as any)?.message}</p>;

  const chosen = new Set(selected || []);

  async function toggle(name: string) {
    const arr = [...chosen];
    const idx = arr.indexOf(name);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(name);
    setSaving(true);
    try {
      await api.put("/bookmakers/selected", { bookmakers: arr });
    } finally {
      setSaving(false);
    }
    mutate();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Bookmakers</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {data?.map((b) => {
          const active = chosen.has(b.name);
          return (
            <button
              key={b.name}
              onClick={() => toggle(b.name)}
              className={`rounded-xl border p-4 text-left bg-white hover:shadow ${active ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="font-medium">{b.name}</div>
              <div className="text-xs text-neutral-500">{active ? "Sélectionné" : "—"}</div>
            </button>
          );
        })}
      </div>
      {saving && <p className="text-sm text-neutral-500">Enregistrement…</p>}
      <p className="text-xs text-neutral-500">
        Astuce: si tu laisses vide les bookmakers dans la fiche match, le backend utilisera cette sélection (ou les defaults du .env).
      </p>
    </div>
  );
}
