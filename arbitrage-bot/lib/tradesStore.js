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
                token1,
                token2,
                amountIn1,
                amountOut1,
                amountIn2,
                amountOut2,
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
                            token1,
                            token2,
                            amountIn1,
                            amountOut1,
                            amountIn2,
                            amountOut2,
                        },
                    ],
                })),
        }),
        {
            name: "trade-store",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useTradeBookStore;
