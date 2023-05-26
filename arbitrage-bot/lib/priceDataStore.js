import { create } from "zustand";
import { BigNumber } from "ethers";

const usePriceStore = create((set, get) => ({
    quotes: new Map(),

    addQuote: (exchange, quote) => {
        set((state) => {
            const quotes = new Map(state.quotes);
            quotes.set(exchange, quote);
            return { quotes };
        });
    },

    getQuote: (exchange) => {
        return get().quotes.get(exchange);
    },

    getArbitrage: () => {
        const { quotes } = get();
        // Look at all the quotes and find the two with the highest price difference
        let bestOpportunity = {};
        let bestProfit = 0;

        for (const [exchange1, quote1] of quotes.entries()) {
            for (const [exchange2, quote2] of quotes.entries()) {
                if (exchange1 === exchange2) continue;

                const price1 = quote1.ask ?? quote1.price;
                const price2 = quote2.bid ?? quote2.price;
                const priceDifference = price1 - price2;
                const amount = Math.min(quote1.amount, quote2.amount);
                const profit = priceDifference * amount;

                if (profit > bestProfit) {
                    bestProfit = profit;
                    bestOpportunity = {
                        exchange1,
                        exchange2,
                        profit,
                        percentProfit: (priceDifference / price1) * 100,
                        quote1,
                        quote2,
                        tokenA: quote1.tokenA,
                        tokenB: quote1.tokenB,
                    };
                }
            }
        }

        return bestOpportunity;
    },
}));

export default usePriceStore;
