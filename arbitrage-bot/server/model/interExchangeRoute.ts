import { Quote } from "@/src/exchanges/types/Quote";
import { Opportunity } from "../types/opportunity";
import Graph from "./graph/Graph";
import GraphVertex from "./graph/GraphVertex";
import GraphEdge from "./graph/GraphEdge";
import { getAdapter } from "../data/adapters";
import { detectAllNegativeCycles } from "./algorithm/findCycles";
import { TokenList } from "../../lib/pairs";
import { Token } from "@/src/exchanges/adapters/exchange";

export async function interExchangeRoute(allQuotes: {
    [key: string]: { [key: string]: Quote };
}): Promise<Opportunity | null> {
    const graph = new Graph<string, number>(true);

    // Add nodes and edges to the graph
    for (const tokenPair in allQuotes) {
        const exchanges = allQuotes[tokenPair];
        const tokens = tokenPair.split("-");

        const node1 = new GraphVertex<string, any>(tokens[0]);
        const node2 = new GraphVertex<string, any>(tokens[1]);
        graph.addVertex(node1);
        graph.addVertex(node2);

        for (const exchange in exchanges) {
            const quote = exchanges[exchange];

            const aToBTransactionPrice = quote.transactionPrice;
            const bToATransactionPrice = 1 / quote.transactionPrice;

            const edge1 = graph.findEdge(node1, node2);
            if (edge1 === null || edge1.weight > aToBTransactionPrice) {
                const edge = new GraphEdge(node1, node2, aToBTransactionPrice);
                graph.addEdge(edge, true);
            }

            const edge2 = graph.findEdge(node2, node1);
            if (edge2 === null || edge2.weight > bToATransactionPrice) {
                const edge = new GraphEdge(node2, node1, bToATransactionPrice);
                graph.addEdge(edge, true);
            }
        }
    }

    // Set diagonal edges to have a weight of 1
    for (const vertex of graph.getAllVertices()) {
        const edge = graph.findEdge(vertex, vertex);
        if (edge === null) {
            const diagonalEdge = new GraphEdge(vertex, vertex, 1);
            graph.addEdge(diagonalEdge, true);
        }
    }

    // Find the best route using Floyd-Warshall
    const cycle = detectAllNegativeCycles(graph);

    if (cycle?.cyclePath.length === 0 || cycle == null) {
        return null;
    }

    // Calculate quotes for the found route
    const { quotes, profit } = await calculateQuotesForRoute(
        cycle.cyclePath,
        allQuotes
    );

    if (profit <= 0) {
        return null;
    }

    return {
        exchanges: quotes.map((v) => v.exchangeType),
        exchangesNames: quotes.map((v) => v.exchangeName),
        path: cycle.cyclePath.map((v) => {
            type TokenKey = keyof typeof TokenList;
            const token = TokenList[v.value as TokenKey] || {
                name: v.value,
                address: v.value,
            };
            return token as Token;
        }),
        profit,
        quotes,
    };
}

async function calculateQuotesForRoute(
    route: GraphVertex<string, any>[],
    allQuotes: {
        [key: string]: { [key: string]: Quote };
    }
): Promise<{ quotes: Quote[]; profit: number }> {
    const exchangeRoute: Quote[] = [];

    let lastAmount: number | undefined;
    let initialAmount: number | undefined;

    for (let i = 1; i < route.length; i++) {
        const tokenPair = `${route[i - 1].value}-${route[i].value}`;
        const exchanges =
            allQuotes[tokenPair] ||
            allQuotes[`${route[i].value}-${route[i - 1].value}`];

        let bestQuote: Quote | null = null;

        for (const exchange in exchanges) {
            const quote = exchanges[exchange];
            const adapter = getAdapter(
                quote.exchange,
                undefined,
                quote.meta.routerAddress,
                quote.meta.factoryAddress
            );

            const isForward =
                route[i - 1].value === quote.tokenA.name &&
                route[i].value === quote.tokenB.name;

            const inputToken = isForward ? quote.tokenA : quote.tokenB;
            const outputToken = isForward ? quote.tokenB : quote.tokenA;

            const calculatedQuote = await adapter.getQuote(
                lastAmount || quote.amount,
                inputToken,
                outputToken,
                true,
                quote.meta
            );

            if (
                bestQuote === null ||
                calculatedQuote.transactionPrice > bestQuote.transactionPrice
            ) {
                bestQuote = calculatedQuote;
                lastAmount = calculatedQuote.amountOut;
            }
        }

        if (bestQuote === null) {
            console.log(tokenPair, exchanges, allQuotes);
            throw new Error("Quote not found");
        }

        if (i === 1) {
            initialAmount = bestQuote.amount;
        }

        exchangeRoute.push(bestQuote);
    }

    if (!initialAmount) {
        throw new Error("Initial amount not found");
    }

    const profit = (lastAmount ?? 0) - initialAmount;

    return { quotes: exchangeRoute, profit };
}
