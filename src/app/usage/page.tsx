"use client";
import { useGet } from "@/lib/swr";

export default function UsagePage() {
  const { data, error, isLoading, mutate } = useGet<any>("/usage");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">API Usage</h1>
      <button onClick={() => mutate()} className="btn">Rafraîchir</button>
      {isLoading && <p>Chargement…</p>}
      {error && <p className="text-red-600">Erreur: {(error as any)?.message}</p>}
      {!!data && (
        <pre className="rounded-xl border bg-white p-4 text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
