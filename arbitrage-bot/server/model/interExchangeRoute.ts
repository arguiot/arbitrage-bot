import { Quote } from "@/src/exchanges/types/Quote";
import { Opportunity } from "../types/opportunity";
import Graph from "./graph/Graph";
import GraphVertex from "./graph/GraphVertex";
import GraphEdge from "./graph/GraphEdge";
import { getAdapter } from "../data/adapters";
import { detectAllNegativeCycles } from "./algorithm/findCycles";

export async function interExchangeRoute(allQuotes: {
    [key: string]: { [key: string]: Quote };
}): Promise<Opportunity | null> {
    const graph = new Graph<string, number>(true);
    const quoteGraph = new Graph<string, Quote>(true);

    // Add nodes and edges to the graph
    for (const tokenPair in allQuotes) {
        const exchanges = allQuotes[tokenPair];
        const tokens = tokenPair.split("-");

        const node1 = new GraphVertex<string, any>(tokens[0]);
        const node2 = new GraphVertex<string, any>(tokens[1]);
        graph.addVertex(node1);
        graph.addVertex(node2);
        quoteGraph.addVertex(node1);
        quoteGraph.addVertex(node2);

        for (const exchange in exchanges) {
            const quote = exchanges[exchange];
            const adapter = getAdapter(exchange);

            const aToB = await adapter.getQuote(
                quote.amount,
                quote.tokenA,
                quote.tokenB,
                true,
                quote.meta
            );
            const bToA = await adapter.getQuote(
                quote.amount,
                quote.tokenA,
                quote.tokenB,
                false,
                quote.meta
            );

            aToB.transactionPrice = quote.transactionPrice;
            bToA.transactionPrice = 1 / quote.transactionPrice;

            const edge1 = graph.findEdge(node1, node2);
            if (edge1 === null || edge1.weight > aToB.transactionPrice) {
                const edge = new GraphEdge(node1, node2, aToB.transactionPrice);
                graph.addEdge(edge, true);
                const quoteEdge = new GraphEdge(node1, node2, aToB);
                quoteGraph.addEdge(quoteEdge, true);
            }

            const edge2 = graph.findEdge(node2, node1);
            if (edge2 === null || edge2.weight > bToA.transactionPrice) {
                const edge = new GraphEdge(node2, node1, bToA.transactionPrice);
                graph.addEdge(edge, true);
                const quoteEdge = new GraphEdge(node2, node1, bToA);
                quoteGraph.addEdge(quoteEdge, true);
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

    const exchangeRoute: Quote[] = [];
    for (let i = 1; i < cycle.cyclePath.length - 1; i++) {
        const edge = quoteGraph.findEdge(
            cycle.cyclePath[i - 1] as GraphVertex<string, any>,
            cycle.cyclePath[i] as GraphVertex<string, any>
        );
        if (edge === null) {
            throw new Error("Edge not found");
        }
        exchangeRoute.push(edge.weight);
    }

    return {
        exchanges: exchangeRoute.map((quote) => quote.exchange),
        profit: cycle.profit,
        quotes: exchangeRoute,
    };
}
