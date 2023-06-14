import { Token } from "../../src/exchanges/adapters/exchange";
import { Quote } from "../../src/exchanges/types/Quote";
import { Opportunity } from "../types/opportunity";
import { SharedMemory } from "./SharedMemory";
import { interPairOpportunity } from "../model/interPairOpportunity";
import { interExchangeRoute } from "../model/interExchangeRoute";

export class PriceDataStore {
    private sharedMemory: SharedMemory;

    constructor(sharedMemory: SharedMemory) {
        this.sharedMemory = sharedMemory;
    }

    // quotes: Map<string, Quote> = new Map();
    // betSizes: Map<string, number> = new Map();

    async addQuote(
        exchange: string,
        tokenA: Token,
        tokenB: Token,
        quote: Quote
    ) {
        const quotes = this.sharedMemory.getStore("quotes");
        // Sort the tokens by name
        const [token1, token2] = [tokenA, tokenB].sort((a, b) =>
            a.name.localeCompare(b.name)
        );
        // Set the value in the cache
        quotes[`${token1.name}-${token2.name}`] =
            quotes[`${token1.name}-${token2.name}`] || {};
        quotes[`${token1.name}-${token2.name}`][`${exchange}`] = quote;
        // Save the cache to shared memory
        await this.sharedMemory.setStore("quotes", quotes);
    }

    getQuote(
        exchange: string,
        tokenA: Token,
        tokenB: Token
    ): Quote | undefined {
        const quotes = this.sharedMemory.getStore("quotes");
        // Sort the tokens by name
        const [token1, token2] = [tokenA, tokenB].sort((a, b) =>
            a.name.localeCompare(b.name)
        );
        // Return the value from the store
        return quotes[`${token1.name}-${token2.name}`]?.[`${exchange}`];
    }

    getQuotes(): {
        [key: string]: { [key: string]: Quote };
    } {
        const quotes = this.sharedMemory.getStore("quotes") as {
            [key: string]: { [key: string]: Quote };
        };
        // Return the value from the cache
        return quotes;
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

        const interRoute = await interExchangeRoute(quotes);

        for (const pair of Object.keys(quotes)) {
            const options = Object.entries(quotes[pair]);
            const opportunity = await interPairOpportunity(options);
            if (opportunity && opportunity.profit > bestProfit) {
                bestOpportunity = opportunity;
                bestProfit = opportunity.profit;
            }
        }

        return bestOpportunity;
    }
}
