import { Token } from "../../src/exchanges/adapters/exchange";
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

        for (const pair of Object.keys(quotes)) {
            const options = Object.entries(quotes[pair]);
            const opportunity = findBestArbitrageRoute(options);
            if (opportunity && opportunity.profit > bestProfit) {
                bestOpportunity = opportunity;
                bestProfit = opportunity.profit;
            }
            debugger;
        }

        return bestOpportunity;
    }
}

const findBestArbitrageRoute = (options: [string, Quote][]): Opportunity | null => {
    const numExchanges = options.length;
    const distances: number[] = Array(numExchanges).fill(Infinity);
    const predecessors: number[] = Array(numExchanges).fill(-1);
    distances[0] = 0;

    const edges: [number, number, number][] = [];
    for (let i = 0; i < numExchanges; i++) {
        for (let j = 0; j < numExchanges; j++) {
            if (i !== j) {
                const optionA = options[i][1];
                const optionB = options[j][1];

                if (optionA.tokenA.address === optionB.tokenA.address && optionA.tokenB.address === optionB.tokenB.address) {
                    const profitMargin = (optionB.amountOut / optionA.amount) * (1 - optionA.transactionPrice);
                    edges.push([i, j, -Math.log(profitMargin)]);
                }
            }
        }
    }

    for (let i = 0; i < numExchanges - 1; i++) {
        for (const [source, target, weight] of edges) {
            if (distances[source] + weight < distances[target]) {
                distances[target] = distances[source] + weight;
                predecessors[target] = source;
            }
        }
    }

    for (const [source, target, weight] of edges) {
        if (distances[source] + weight < distances[target]) {
            const path: number[] = [target];
            let prev = predecessors[target];

            while (prev !== -1 && prev !== target) {
                path.unshift(prev);
                prev = predecessors[prev];
            }

            const exchange1 = options[path[0]][0];
            const exchange2 = options[path[1]][0];
            const quote1 = options[path[0]][1];
            const quote2 = options[path[1]][1];
            const profit = quote1.amount * (quote2.amountOut / quote1.amount) * (1 - quote1.transactionPrice) - quote1.amount;
            const percentProfit = (profit / quote1.amount) * 100;

            return {
                exchange1,
                exchange2,
                profit,
                percentProfit,
                quote1,
                quote2,
            };
        }
    }

    return null;
};
