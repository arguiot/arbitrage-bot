import { Quote } from "../../src/exchanges/types/Quote";
import { Opportunity } from "../types/opportunity";
import { SharedMemory } from "./SharedMemory";

export class PriceDataStore {
    private sharedMemory: SharedMemory;

    constructor(sharedMemory: SharedMemory) {
        this.sharedMemory = sharedMemory;
    }

    // quotes: Map<string, Quote> = new Map();
    // betSizes: Map<string, number> = new Map();

    async addQuote(exchange: string, quote: Quote) {
        const quotes = this.sharedMemory.getStore("quotes");
        // Set the value in the cache
        quotes[`${exchange}`] = quote;
        // Save the cache to shared memory
        await this.sharedMemory.setStore("quotes", quotes);
    }

    getQuote(exchange: string): Quote | undefined {
        const quotes = this.sharedMemory.getStore("quotes");
        // Return the value from the store
        return quotes[`${exchange}`];
    }

    getQuotes(): [string, Quote][] {
        const quotes = this.sharedMemory.getStore("quotes");
        // Return the value from the cache
        return Object.entries(quotes);
    }

    async addBetSize(exchange: string, betSize: number) {
        const betSizes = this.sharedMemory.getStore("bet-sizes");
        // Set the value in the cache
        betSizes[`${exchange}`] = betSize;
        // Save the cache to shared memory
        await this.sharedMemory.setStore("bet-sizes", betSizes);
    }

    getBetSize(exchange: string): number | undefined {
        const betSizes = this.sharedMemory.getStore("bet-sizes");
        // Return the value from the cache
        return betSizes[`${exchange}`];
    }

    getBetSizes(): number[] {
        const betSizes = this.sharedMemory.getStore("bet-sizes");
        // Return the value from the cache
        return Object.values(betSizes);
    }

    getLowestBetSize(): number {
        let lowestBetSize = Infinity;
        for (const betSize of this.getBetSizes()) {
            if (betSize < lowestBetSize) {
                lowestBetSize = betSize;
            }
        }
        return lowestBetSize;
    }

    getArbitrageOpportunity(): Opportunity | null {
        // Look at all the quotes and find the two with the highest price difference
        let bestOpportunity: Opportunity | null = null;
        let bestProfit = 0;

        const quotes = this.getQuotes();

        for (const [exchange1, quote1] of quotes) {
            for (const [exchange2, quote2] of quotes) {
                if (exchange1 === exchange2) continue;
                if (quote1.amount === 0 || quote2.amount === 0) continue;

                const price1 = quote1.transactionPrice;
                const price2 = quote2.transactionPrice;

                const priceDifference = price2 - price1;
                const profit = priceDifference * quote2.amount;

                if (profit > bestProfit) {
                    bestProfit = profit;
                    bestOpportunity = {
                        exchange1,
                        exchange2,
                        profit,
                        percentProfit: profit / (quote2.amount * price2),
                        quote1,
                        quote2,
                    };
                }
            }
        }

        return bestOpportunity;
    }
}
