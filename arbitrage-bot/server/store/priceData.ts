import { Quote } from "../../scripts/exchanges/types/Quote";
import { Opportunity } from "../types/opportunity";

export class PriceDataStore {
    static shared = new PriceDataStore();

    quotes: Map<string, Quote> = new Map();
    betSizes: Map<string, number> = new Map();

    addQuote(exchange: string, quote: Quote) {
        this.quotes.set(exchange, quote);
    }

    getQuote(exchange: string): Quote | undefined {
        return this.quotes.get(exchange);
    }

    addBetSize(exchange: string, betSize: number) {
        this.betSizes.set(exchange, betSize);
    }

    getBetSize(exchange: string): number | undefined {
        return this.betSizes.get(exchange);
    }

    getLowestBetSize(): number {
        let lowestBetSize = Infinity;
        for (const betSize of this.betSizes.values()) {
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

        for (const [exchange1, quote1] of this.quotes.entries()) {
            for (const [exchange2, quote2] of this.quotes.entries()) {
                if (exchange1 === exchange2) continue;

                const price1 = quote1.ask ?? quote1.price;
                const price2 = quote2.bid ?? quote2.price;
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
