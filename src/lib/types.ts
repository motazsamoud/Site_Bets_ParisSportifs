export type Sport = {
  name: string;
  slug: string;
};

export type League = {
  name: string;
  slug: string;
};

/**
 * Type principal d’un match (Event)
 * ✅ Compatible avec les cotes temps réel et le WebSocket
 */
export type Event = {
  id: number | string;
  home: string;
  away: string;
  date: string; // ISO
  status?: string; // "live" | "scheduled" ...
  sport?: { name: string; slug: string };
  league?: { name: string; slug: string };

  /** ✅ Champs facultatif pour les cotes (odds live) */
  odds?: {
    h2h?: {
      home?: { price?: string; updatedAt?: string };
      draw?: { price?: string; updatedAt?: string };
      away?: { price?: string; updatedAt?: string };
    };
    totals?: {
      over?: { price?: string; line?: string; updatedAt?: string };
      under?: { price?: string; line?: string; updatedAt?: string };
    };
    dnb?: {
      home?: { price?: string; updatedAt?: string };
      away?: { price?: string; updatedAt?: string };
    };
    [key: string]: any; // ← extensible pour d’autres marchés (Double Chance, BTTS, etc.)
  };
};

/** Structure générique pour API odds */
export type OddsResponse = any;
