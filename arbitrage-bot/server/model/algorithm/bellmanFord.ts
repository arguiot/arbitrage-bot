import Graph from "../graph/Graph";
import GraphVertex from "../graph/GraphVertex";

interface Result<T> {
    distances: { [key: string]: number };
    previousVertices: { [key: string]: GraphVertex<T> | null };
}

export default function bellmanFord<T>(
    graph: Graph<T>,
    startVertex: GraphVertex<T>
): Result<T> {
    const distances: { [key: string]: number } = {};
    const previousVertices: { [key: string]: GraphVertex<T> | null } = {};

    // Init all distances with infinity assuming that currently we can't reach
    // any of the vertices except start one.
    distances[startVertex.getKey()] = 0;
    graph.getAllVertices().forEach((vertex) => {
        previousVertices[vertex.getKey()] = null;
        if (vertex.getKey() !== startVertex.getKey()) {
            distances[vertex.getKey()] = Infinity;
        }
    });

    // We need (|V| - 1) iterations.
    for (
        let iteration = 0;
        iteration < graph.getAllVertices().length - 1;
        iteration += 1
    ) {
        // During each iteration go through all vertices.
        Object.keys(distances).forEach((vertexKey) => {
            const vertex = graph.getVertexByKey(vertexKey);

            // Go through all vertex edges.
            graph.getNeighbors(vertex).forEach((neighbor) => {
                const edge = graph.findEdge(vertex, neighbor);
                // Find out if the distance to the neighbor is shorter in this iteration
                // then in previous one.
                const distanceToVertex = distances[vertex.getKey()];
                const distanceToNeighbor =
                    distanceToVertex + (edge?.weight ?? 0);
                if (distanceToNeighbor < distances[neighbor.getKey()]) {
                    distances[neighbor.getKey()] = distanceToNeighbor;
                    previousVertices[neighbor.getKey()] = vertex;
                }
            });
        });
    }

    return {
        distances,
        previousVertices,
    };
}
