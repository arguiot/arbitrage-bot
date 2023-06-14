import { Quote } from "@/src/exchanges/types/Quote";
import { Opportunity } from "../types/opportunity";
import Graph from "./graph/Graph";
import GraphVertex from "./graph/GraphVertex";
import GraphEdge from "./graph/GraphEdge";
import { getAdapter } from "../data/adapters";
import { floydWarshall, findMaxDistanceVertices, floydWarshallPath } from "./algorithm/floydWarshall";

export async function interExchangeRoute(allQuotes: {
    [key: string]: { [key: string]: Quote };
}): Promise<Opportunity | null> {
    const graph = new Graph<string>(true);

    // Add nodes and edges to the graph
    for (const tokenPair in allQuotes) {
        const exchanges = allQuotes[tokenPair];
        const tokens = tokenPair.split("-");

        const node1 = new GraphVertex(tokens[0]);
        const node2 = new GraphVertex(tokens[1]);
        graph.addVertex(node1);
        graph.addVertex(node2);

        for (const exchange in exchanges) {
            const quote = exchanges[exchange];
            const adapter = getAdapter(exchange);
            const aToB = await adapter.getQuote(quote.amount, quote.tokenA, quote.tokenB, true, quote.meta);
            const bToA = await adapter.getQuote(quote.amount, quote.tokenA, quote.tokenB, false, quote.meta);

            const edge1 = graph.findEdge(node1, node2);
            if (edge1 === null || edge1.weight > aToB.transactionPrice) {
                const edge = new GraphEdge(node1, node2, aToB.transactionPrice);
                graph.addEdge(edge, true);
            }

            const edge2 = graph.findEdge(node2, node1);
            if (edge2 === null || edge2.weight > bToA.transactionPrice) {
                const edge = new GraphEdge(node2, node1, bToA.transactionPrice);
                graph.addEdge(edge, true);
            }
        }
    }

    // Find the best route using Floyd-Warshall
    const fw = floydWarshall(graph);
    const { start, end } = findMaxDistanceVertices(fw, graph);

    JSON.stringify(graph.getAllEdges().map((edge) => {
        return {
            start: edge.startVertex.getKey(),
            end: edge.endVertex.getKey(),
            weight: edge.weight
        };
    }));
    debugger;

    const { distance, path } = floydWarshallPath(fw, graph, start!, end!);
    
    debugger;
    
    return null;
};
