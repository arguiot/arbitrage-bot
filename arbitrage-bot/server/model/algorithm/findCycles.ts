import Graph from "../graph/Graph";
import GraphVertex from "../graph/GraphVertex";

export function detectAllNegativeCycles<T, U>(
    graph: Graph<T, U>
): { cyclePath: GraphVertex<T, U>[]; profit: number } | null {
    const vertices = graph.getAllVertices();
    const verticesIndices = graph.getVerticesIndices();
    const adjacencyMatrix = graph.getAdjacencyMatrix();

    const distanceMatrix: number[][] = Array(vertices.length)
        .fill(null)
        .map(() => Array(vertices.length).fill(Infinity));

    const predecessorMatrix: (GraphVertex<T, U> | null)[][] = Array(
        vertices.length
    )
        .fill(null)
        .map(() => Array(vertices.length).fill(null));

    // Initialization
    for (let i = 0; i < vertices.length; i++) {
        distanceMatrix[i][i] = 0;
        predecessorMatrix[i][i] = vertices[i];

        for (let j = 0; j < vertices.length; j++) {
            if (i === j) continue;

            const edge = adjacencyMatrix[i][j];
            if (edge !== Infinity) {
                distanceMatrix[i][j] = -Math.log(edge);
                predecessorMatrix[i][j] = vertices[i];
            }
        }
    }

    // Iterations
    for (let v = 0; v < vertices.length; v++) {
        for (let i = 0; i < vertices.length; i++) {
            for (let j = 0; j < vertices.length; j++) {
                if (
                    distanceMatrix[i][j] >
                    distanceMatrix[i][v] + distanceMatrix[v][j]
                ) {
                    distanceMatrix[i][j] =
                        distanceMatrix[i][v] + distanceMatrix[v][j];
                    predecessorMatrix[i][j] = predecessorMatrix[v][j];
                }
            }
        }
    }

    // Negative cycle?
    let finalVertex: GraphVertex<T, U> | null = null;
    let predecessorVertex: GraphVertex<T, U> | null = null;
    let startVertexIndex = -1;

    for (let i = 0; i < vertices.length; i++) {
        if (distanceMatrix[i][i] < 0) {
            finalVertex = vertices[i];
            predecessorVertex = predecessorMatrix[i][i];
            startVertexIndex = i;
            break;
        }
    }

    if (finalVertex === null || predecessorVertex === null) {
        return null;
    }

    let beginningReached = false;
    const cyclePath: GraphVertex<T, U>[] = [finalVertex, predecessorVertex];

    while (!beginningReached) {
        const currentVertexIndex =
            verticesIndices[cyclePath[cyclePath.length - 1].getKey()];
        predecessorVertex =
            predecessorMatrix[startVertexIndex][currentVertexIndex];
        if (predecessorVertex) cyclePath.push(predecessorVertex);

        if (cyclePath[0] === cyclePath[cyclePath.length - 1]) {
            beginningReached = true;
        }
    }

    cyclePath.reverse();

    // Calculate profit
    let profit = 1;
    for (let i = 0; i < cyclePath.length - 1; i++) {
        // Use adjacency matrix to get edge weight
        const startVertexIndex = verticesIndices[cyclePath[i].getKey()];
        const endVertexIndex = verticesIndices[cyclePath[i + 1].getKey()];
        const edgeWeight = adjacencyMatrix[startVertexIndex][endVertexIndex];

        profit *= edgeWeight;
    }

    return { cyclePath, profit };
}
