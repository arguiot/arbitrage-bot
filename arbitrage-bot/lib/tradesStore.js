import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useTradeBookStore = create(
    persist(
        (set, get) => ({
            trades: [],
            addTrade: ({
                timestamp,
                pair,
                exchange1,
                exchange2,
                price1,
                price2,
                profit,
            }) =>
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
            getTrade: () => get().trades.sort((a, b) => b.timestamp - a.timestamp),
        }),
        {
            name: "trade-store",
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);

export default useTradeBookStore;
