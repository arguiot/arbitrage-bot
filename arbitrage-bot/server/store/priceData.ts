import { Quote } from "../../src/exchanges/types/Quote";
import Credentials from "../credentials/Credentials";
import { getAdapter } from "../data/adapters";
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

    async getArbitrageOpportunity(): Promise<Opportunity | null> {
        // Look at all the quotes and find the two with the highest price difference
        let bestOpportunity: Opportunity | null = null;
        let bestProfit = 0;

        const quotes = this.getQuotes();

        for (const [exchange1, quote1] of quotes) {
            for (const [exchange2, quote2] of quotes) {
                if (exchange1 === exchange2) continue;
                if (quote1.amount === 0 || quote2.amount === 0) continue;
                if (quote1.price > quote2.price) continue;

                const _exchange1 = getAdapter(
                    exchange1,
                    Credentials.shared.wallet,
                    quote1.meta.routerAddress,
                    quote1.meta.factoryAddress
                );

                const _exchange2 = getAdapter(
                    exchange2,
                    Credentials.shared.wallet,
                    quote2.meta.routerAddress,
                    quote2.meta.factoryAddress
                );

                const price1 = await _exchange1.getQuote(
                    quote1.amount,
                    quote1.tokenA,
                    quote1.tokenB,
                    false,
                    quote1.meta // Important, so that the quote is calculated offline
                );
                const price2 = await _exchange2.getQuote(
                    quote2.amount,
                    quote2.tokenA,
                    quote2.tokenB,
                    true,
                    quote2.meta // Important, so that the quote is calculated offline
                );

                const profit = price2.amountOut - price1.amountOut;

                console.log(
                    `Considering profit of ${profit} from ${exchange1} to ${exchange2}...`
                );

                if (profit > bestProfit) {
                    bestProfit = profit;
                    bestOpportunity = {
                        exchange1,
                        exchange2,
                        profit,
                        percentProfit:
                            profit / (quote2.amount * price2.transactionPrice),
                        quote1,
                        quote2,
                    };
                }
            }
        }

        return bestOpportunity;
    }
}
