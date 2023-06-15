import GraphVertex from "./GraphVertex";
import GraphEdge from "./GraphEdge";

export default class Graph<T, U> {
    private vertices: { [key: string]: GraphVertex<T, U> };
    private edges: { [key: string]: GraphEdge<T, U> };
    private isDirected: boolean;

    constructor(isDirected = false) {
        this.vertices = {};
        this.edges = {};
        this.isDirected = isDirected;
    }

    public addVertex(newVertex: GraphVertex<T, U>): Graph<T, U> {
        this.vertices[newVertex.getKey()] = newVertex;
        return this;
    }

    public getVertexByKey(vertexKey: string): GraphVertex<T, U> {
        return this.vertices[vertexKey];
    }

    public getNeighbors(vertex: GraphVertex<T, U>): GraphVertex<T, U>[] {
        return vertex.getNeighbors();
    }

    public getAllVertices(): GraphVertex<T, U>[] {
        return Object.values(this.vertices);
    }

    public getAllEdges(): GraphEdge<T, U>[] {
        return Object.values(this.edges);
    }

    public addEdge(
        edge: GraphEdge<T, U>,
        overwrite: boolean = false
    ): Graph<T, U> {
        let startVertex = this.getVertexByKey(edge.startVertex.getKey());
        let endVertex = this.getVertexByKey(edge.endVertex.getKey());

        if (!startVertex) {
            this.addVertex(edge.startVertex);
            startVertex = this.getVertexByKey(edge.startVertex.getKey());
        }

        if (!endVertex) {
            this.addVertex(edge.endVertex);
            endVertex = this.getVertexByKey(edge.endVertex.getKey());
        }

        if (this.edges[edge.getKey()] && !overwrite) {
            throw new Error("Edge has already been added before");
        } else {
            this.edges[edge.getKey()] = edge;
        }

        if (this.isDirected) {
            startVertex.addEdge(edge);
        } else {
            startVertex.addEdge(edge);
            endVertex.addEdge(edge);
        }

        return this;
    }

    public deleteEdge(edge: GraphEdge<T, U>): void {
        if (this.edges[edge.getKey()]) {
            delete this.edges[edge.getKey()];
        } else {
            throw new Error("Edge not found in graph");
        }

        const startVertex = this.getVertexByKey(edge.startVertex.getKey());
        const endVertex = this.getVertexByKey(edge.endVertex.getKey());

        startVertex.deleteEdge(edge);
        endVertex.deleteEdge(edge);
    }

    public findEdge(
        startVertex: GraphVertex<T, U>,
        endVertex: GraphVertex<T, U>
    ): GraphEdge<T, U> | null {
        const startingVertex = startVertex.getKey();
        const endingVertex = endVertex.getKey();

        const edge = this.edges[`${startingVertex}_${endingVertex}`];
        if (!edge && !this.isDirected) {
            return this.edges[`${endingVertex}_${startingVertex}`] || null;
        }
        return edge || null;
    }

    public reverse(): Graph<T, U> {
        this.getAllEdges().forEach((edge) => {
            this.deleteEdge(edge);
            edge.reverse();
            this.addEdge(edge);
        });

        return this;
    }

    public getVerticesIndices(): { [key: string]: number } {
        const verticesIndices: { [key: string]: number } = {};
        this.getAllVertices().forEach((vertex, index) => {
            verticesIndices[vertex.getKey()] = index;
        });

        return verticesIndices;
    }

    public getAdjacencyMatrix(): number[][] {
        const verticesIndices = this.getVerticesIndices();
        const edges = this.getAllEdges();

        const length = this.getAllVertices().length;

        const adjacencyMatrix = Array(length)
            .fill(null)
            .map(() => {
                return Array(length).fill(Infinity);
            });

        edges.forEach((graphEdge) => {
            const startVertex = graphEdge.startVertex;
            const startVertexIndex = verticesIndices[startVertex.getKey()];
            const endVertex = graphEdge.endVertex;
            const endVertexIndex = verticesIndices[endVertex.getKey()];
            adjacencyMatrix[startVertexIndex][endVertexIndex] =
                graphEdge.weight;
        });

        adjacencyMatrix.forEach((row, rowIndex) => {
            row.forEach((value, columnIndex) => {
                if (rowIndex === columnIndex) {
                    adjacencyMatrix[rowIndex][columnIndex] = 1;
                }
            });
        });

        return adjacencyMatrix;
    }

    /**
     * Prints the list of edges, with their weights, of the graph
     * @returns {string} The list of edges, with their weights, of the graph
     * @memberof Graph
     * @example
     * const graph = new Graph();
     * graph.addEdge(new GraphEdge(vertexA, vertexB, 10));
     * graph.addEdge(new GraphEdge(vertexA, vertexC, 20));
     * graph.addEdge(new GraphEdge(vertexB, vertexC, 30));
     * graph.print();
     * // A -> B: 10
     * // A -> C: 20
     * // B -> C: 30
     */
    public toString(): string {
        return Object.values(this.edges)
            .map((edge) => edge.toString())
            .join("\n");
    }
}
