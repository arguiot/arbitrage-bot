import { create } from 'zustand';

const useTradeBookStore = create((set) => ({
  trades: [],
  addTrade: ({ timestamp, pair, exchange1, exchange2, amount1, amount2, profit }) =>
    set((state) => ({
      trades: [
        ...state.trades,
        {
          timestamp,
          pair,
          exchange1,
          exchange2,
          amount1,
          amount2,
            profit,
        },
      ],
    })),
}));

export default useTradeBookStore;