import { format } from "date-fns";

export const fmtDate = (iso: string) =>
  iso ? format(new Date(iso), "yyyy-MM-dd HH:mm") : "-";

// essaie d’extraire un tableau H2H si la structure ressemble à
// bookmakers[] -> markets[] -> outcomes[]
export function extractH2H(odds: any) {
  try {
    const books: any[] =
      odds?.bookmakers || odds?.data || odds?.bookies || [];
    const rows: { bookmaker: string; outcomes: { name: string; price: number }[] }[] = [];
    for (const b of books) {
      const markets: any[] = b.markets || [];
      const m =
        markets.find(
          (x) =>
            ["H2H", "h2h", "ML", "Moneyline"].includes(x.key) ||
            ["H2H", "h2h", "ML", "Moneyline"].includes(x.market)
        ) || markets[0];
      if (!m) continue;
      const outcomes = (m.outcomes || m.selections || [])
        .map((o: any) => ({
          name: o.name || o.outcome || o.team || "-",
          price: Number(o.price || o.odds || o.decimal || o.value || 0),
        }))
        .filter((x: any) => !Number.isNaN(x.price) && x.price > 0);
      if (outcomes.length) rows.push({ bookmaker: b.title || b.name || b.key, outcomes });
    }
    return rows;
  } catch {
    return [];
  }
}
