import { Quote } from "@/src/exchanges/types/Quote";
import { Opportunity } from "../types/opportunity";

export async function interPairOpportunity(
    options: [string, Quote][]
): Promise<Opportunity | null> {
    let bestOpportunity: Opportunity | null = null;

    for (const [exchange1, quote1] of options) {
        for (const [exchange2, quote2] of options) {
            if (exchange1 === exchange2) continue;
            if (quote1.amountOut <= 0 || quote2.amountOut <= 0) {
                continue;
            }
            const weight = quote2.amountOut - quote1.amountOut;

            if (weight <= 0) {
                continue;
            }

            const opportunity: Opportunity = {
                exchanges: [exchange1, exchange2],
                profit: weight,
                quotes: [quote1, quote2],
            };

            if (
                bestOpportunity === null ||
                opportunity.profit > bestOpportunity.profit
            ) {
                bestOpportunity = opportunity;
            }
        }
    }

    return bestOpportunity;
}
