import GraphVertex from "./GraphVertex";
import GraphEdge from "./GraphEdge";

export default class Graph<T> {
    private vertices: { [key: string]: GraphVertex<T> };
    private edges: { [key: string]: GraphEdge<T> };
    private isDirected: boolean;

    constructor(isDirected = false) {
        this.vertices = {};
        this.edges = {};
        this.isDirected = isDirected;
    }

    public addVertex(newVertex: GraphVertex<T>): Graph<T> {
        this.vertices[newVertex.getKey()] = newVertex;
        return this;
    }

    public getVertexByKey(vertexKey: string): GraphVertex<T> {
        return this.vertices[vertexKey];
    }

    public getNeighbors(vertex: GraphVertex<T>): GraphVertex<T>[] {
        return vertex.getNeighbors();
    }

    public getAllVertices(): GraphVertex<T>[] {
        return Object.values(this.vertices);
    }

    public getAllEdges(): GraphEdge<T>[] {
        return Object.values(this.edges);
    }

    public addEdge(edge: GraphEdge<T>): Graph<T> {
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

        if (this.edges[edge.getKey()]) {
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

    public deleteEdge(edge: GraphEdge<T>): void {
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
        startVertex: GraphVertex<T>,
        endVertex: GraphVertex<T>
    ): GraphEdge<T> | null {
        const vertex = this.getVertexByKey(startVertex.getKey());

        if (!vertex) {
            return null;
        }

        return vertex.findEdge(endVertex);
    }

    public getWeight(): number {
        return this.getAllEdges().reduce((weight, graphEdge) => {
            return weight + graphEdge.weight;
        }, 0);
    }

    public reverse(): Graph<T> {
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
        const vertices = this.getAllVertices();
        const verticesIndices = this.getVerticesIndices();

        const adjacencyMatrix = Array(vertices.length)
            .fill(null)
            .map(() => {
                return Array(vertices.length).fill(Infinity);
            });

        vertices.forEach((vertex, vertexIndex) => {
            vertex.getNeighbors().forEach((neighbor) => {
                const neighborIndex = verticesIndices[neighbor.getKey()];
                adjacencyMatrix[vertexIndex][neighborIndex] = this.findEdge(
                    vertex,
                    neighbor
                )?.weight;
            });
        });

        return adjacencyMatrix;
    }

    public toString(): string {
        return Object.keys(this.vertices).toString();
    }
}
