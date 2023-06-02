import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useTradeBookStore = create(
    persist(
        (set) => ({
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
        }),
        {
            name: "trade-store",
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);

export default useTradeBookStore;
