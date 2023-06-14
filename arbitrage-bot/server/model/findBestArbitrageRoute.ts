import { Quote } from "@/src/exchanges/types/Quote";
import { Opportunity } from "../types/opportunity";
import Graph from "./graph/Graph";
import GraphEdge from "./graph/GraphEdge";
import GraphVertex from "./graph/GraphVertex";
import bellmanFord from "./algorithm/bellmanFord";
import { floydWarshall, floydWarshallPath, findMaxDistanceVertices } from "./algorithm/floydWarshall";
import { getAdapter } from "../../server/data/adapters";

export async function findBestArbitrageRoute(
    options: [string, Quote][]
): Promise<Opportunity | null> {
    // const graph = new Graph<string>();

    let bestOpportunity: Opportunity | null = null;

    for (const [exchange1, quote1] of options) {
        for (const [exchange2, quote2] of options) {
            if (exchange1 === exchange2) continue;

            // const adapter1 = getAdapter(exchange1);
            // const adapter2 = getAdapter(exchange2);

            // const amountBetween = quote1.amount;

            // const _quote1 = await adapter1.getQuote(amountBetween, quote1.tokenA, quote1.tokenB, false, quote1.meta);
            // const _quote2 = await adapter2.getQuote(amountBetween, quote2.tokenA, quote2.tokenB, true, quote2.meta);

            if (quote1.amountOut <= 0 || quote2.amountOut <= 0) {
                continue;
            }
            const weight = quote2.amountOut - quote1.amountOut;

            if (weight <= 0) {
                continue;
            }

            // debugger;

            // const edge = new GraphEdge<string>(
            //     vertexA,
            //     vertexB,
            //     weight
            // );
            // graph.addEdge(edge);

            const opportunity: Opportunity = {
                exchange1,
                exchange2,
                profit: weight,
                percentProfit: weight / quote1.amountOut,
                quote1: quote1,
                quote2: quote2,
            };

            if (bestOpportunity === null || opportunity.profit > bestOpportunity.profit) {
                bestOpportunity = opportunity;
            }
        }
    }

    // const fw = floydWarshall(graph);
    // const { start, end, maxDistance } = findMaxDistanceVertices(fw, graph);
    // if (start === null || end === null) {
    //     return null;
    // }

    // const path = floydWarshallPath(fw, graph, start, end);

    return bestOpportunity;
};
