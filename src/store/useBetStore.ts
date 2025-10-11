import { create } from "zustand";

export type BetItem = {
  fixtureId: string;
  market: string;
  selection: string;
  odds: number;
  event: string;
};

type BetStore = {
  slip: BetItem[];
  addBet: (bet: BetItem) => void;
  removeBet: (fixtureId: string, market: string) => void;
  clearSlip: () => void;
};

export const useBetStore = create<BetStore>((set) => ({
  slip: [],

  addBet: (bet) =>
    set((state) => {
      // 🧠 supprime le pari du même match (même fixture + marché)
      const filtered = state.slip.filter(
        (b) => !(b.fixtureId === bet.fixtureId && b.market === bet.market)
      );

      // ajoute le nouveau pari
      return { slip: [...filtered, bet] };
    }),

  removeBet: (fixtureId, market) =>
    set((state) => ({
      slip: state.slip.filter(
        (b) => !(b.fixtureId === fixtureId && b.market === market)
      ),
    })),

  clearSlip: () => set({ slip: [] }),
}));
