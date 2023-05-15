import { create } from 'zustand';

const useTradeBookStore = create((set) => ({
    trades: [],
    addTrade: ({ timestamp, pair, exchange1, exchange2, price1, price2, profit }) =>
        set((state) => ({
            trades: [
                ...state.trades,
                {
                    timestamp,
                    pair,
                    exchange1,
                    exchange2,
                    price1,
                    price2,
                    profit,
                },
            ],
        })),
}));

export default useTradeBookStore;
