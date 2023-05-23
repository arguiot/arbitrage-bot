import { create } from "zustand";

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
}));

export default usePriceStore;
