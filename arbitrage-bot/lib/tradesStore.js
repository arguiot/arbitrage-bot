import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useTradeBookStore = create(
    persist(
        (set, get) => ({
            trades: [
                {
                    timestamp: 0,
                    token: "ETH",
                    startAmount: 61.54,
                    route: [
                        {
                            exchange: "uniswap",
                            token: "ETH",
                        },
                        {
                            exchange: "pancakeswap",
                            token: "USDC",
                        },
                        {
                            exchange: "uniswap",
                            token: "ETH",
                        },
                    ],
                    profit: 2.5,
                    fees: 0.03,
                },
            ],
            addTrade: ({
                timestamp,
                token,
                startAmount,
                route,
                profit,
                fees,
            }) =>
                set((state) => ({
                    trades: [
                        ...state.trades,
                        {
                            timestamp,
                            token,
                            startAmount,
                            route,
                            profit,
                            fees,
                        },
                    ],
                })),
            removeTrade: (date) => {
                set((state) => {
                    const index = state.trades.findIndex(
                        (trade) => trade.timestamp === date
                    );
                    if (index === -1) return state;
                    const trades = [...state.trades];
                    trades.splice(index, 1);
                    return { trades };
                });
            },
        }),
        {
            name: "trade-store",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useTradeBookStore;
