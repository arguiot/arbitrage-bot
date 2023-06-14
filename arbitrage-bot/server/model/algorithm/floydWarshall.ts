import Graph from "../graph/Graph";
import GraphVertex from "../graph/GraphVertex";

interface Result<T> {
    distances: number[][];
    nextVertices: (GraphVertex<T> | null)[][];
}

export function floydWarshall<T>(graph: Graph<T>): Result<T> {
    // Get all graph vertices.
    const vertices = graph.getAllVertices();

    // Init previous vertices matrix with nulls meaning that there are no
    // previous vertices exist that will give us shortest path.
    const nextVertices: (GraphVertex<T> | null)[][] = Array(vertices.length)
        .fill(null)
        .map(() => {
            return Array(vertices.length).fill(null);
        });

    // Init distances matrix with Infinities meaning there are no paths
    // between vertices exist so far.
    const distances: number[][] = Array(vertices.length)
        .fill(null)
        .map(() => {
            return Array(vertices.length).fill(Infinity);
        });

    // Init distance matrix with the distance we already know (from existing edges).
    // And also init previous vertices from the edges.
    vertices.forEach((startVertex, startIndex) => {
        vertices.forEach((endVertex, endIndex) => {
            if (startVertex === endVertex) {
                // Distance to the vertex itself is 0.
                distances[startIndex][endIndex] = 0;
            } else {
                // Find edge between the start and end vertices.
                const edge = graph.findEdge(startVertex, endVertex);

                if (edge) {
                    // There is an edge from vertex with startIndex to vertex with endIndex.
                    // Save distance and previous vertex.
                    distances[startIndex][endIndex] = edge.weight;
                    nextVertices[startIndex][endIndex] = startVertex;
                } else {
                    distances[startIndex][endIndex] = Infinity;
                }
            }
        });
    });

    // Now let's go to the core of the algorithm.
    // Let's all pair of vertices (from start to end ones) and try to check if there
    // is a shorter path exists between them via middle vertex. Middle vertex may also
    // be one of the graph vertices. As you may see now we're going to have three
    // loops over all graph vertices: for start, end and middle vertices.
    vertices.forEach((middleVertex, middleIndex) => {
        // Path starts from startVertex with startIndex.
        vertices.forEach((_startVertex, startIndex) => {
            // Path ends to endVertex with endIndex.
            vertices.forEach((_endVertex, endIndex) => {
                // Compare existing distance from startVertex to endVertex, with distance
                // from startVertex to endVertex but via middleVertex.
                // Save the shortest distance and previous vertex that allows
                // us to have this shortest distance.
                const distViaMiddle =
                    distances[startIndex][middleIndex] +
                    distances[middleIndex][endIndex];

                if (distances[startIndex][endIndex] > distViaMiddle) {
                    // We've found a shortest pass via middle vertex.
                    distances[startIndex][endIndex] = distViaMiddle;
                    nextVertices[startIndex][endIndex] = middleVertex;
                }
            });
        });
    });

    // Shortest distance from x to y: distance[x][y].
    // Next vertex after x one in path from x to y: nextVertices[x][y].
    return { distances, nextVertices };
}

interface PathResult<T> {
    distance: number;
    path: (GraphVertex<T> | null)[];
}

export function floydWarshallPath<T>(
    result: Result<T>,
    graph: Graph<T>,
    start: GraphVertex<T>,
    end: GraphVertex<T>
): PathResult<T> {
    const vertices = graph.getAllVertices();
    const startIndex = vertices.findIndex((vertex) => vertex === start);
    const endIndex = vertices.findIndex((vertex) => vertex === end);

    if (startIndex === -1 || endIndex === -1) {
        throw new Error("Start or end vertex not found in the graph.");
    }

    const path: GraphVertex<T>[] = [];

    if (result.nextVertices[startIndex][endIndex] === null) {
        return {
            distance: Infinity,
            path: [],
        };
    }

    let currentVertex: GraphVertex<T> | null = start;
    while (currentVertex !== end) {
        if (currentVertex !== null) path.push(currentVertex);
        const currentIndex = vertices.findIndex((vertex) => vertex === currentVertex);
        const nextVertex = result.nextVertices[currentIndex][endIndex];

        if (nextVertex === currentVertex) {
            break;
        }

        currentVertex = nextVertex;
    }
    path.push(end);

    return {
        distance: result.distances[startIndex][endIndex],
        path,
    };
}


export function findMaxDistanceVertices<T>(result: Result<T>, graph: Graph<T>): {
    start: GraphVertex<T> | null;
    end: GraphVertex<T> | null;
    maxDistance: number;
} {
    const vertices = graph.getAllVertices();

    let maxDistance = -Infinity;
    let maxStartIndex = -1;
    let maxEndIndex = -1;

    for (let i = 0; i < result.distances.length; i++) {
        for (let j = 0; j < result.distances[i].length; j++) {
            const distance = result.distances[i][j];
            if (i !== j && distance !== Infinity && distance > maxDistance) {
                maxDistance = distance;
                maxStartIndex = i;
                maxEndIndex = j;
            }
        }
    }

    return {
        start: maxStartIndex !== -1 ? vertices[maxStartIndex] : null,
        end: maxEndIndex !== -1 ? vertices[maxEndIndex] : null,
        maxDistance,
    };
}
