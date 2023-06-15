import GraphVertex from "./GraphVertex";

export default class GraphEdge<T, U> {
    public startVertex: GraphVertex<T, U>;
    public endVertex: GraphVertex<T, U>;
    public weight: U;

    constructor(
        startVertex: GraphVertex<T, U>,
        endVertex: GraphVertex<T, U>,
        weight: U
    ) {
        this.startVertex = startVertex;
        this.endVertex = endVertex;
        this.weight = weight;
    }

    public getKey(): string {
        const startVertexKey = this.startVertex.getKey();
        const endVertexKey = this.endVertex.getKey();

        return `${startVertexKey}_${endVertexKey}`;
    }

    public reverse(): GraphEdge<T, U> {
        const tmp = this.startVertex;
        this.startVertex = this.endVertex;
        this.endVertex = tmp;

        return this;
    }

    /**
     * Prints edge in the format: (start_vertex) -> (end_vertex): (weight)
     */
    public toString(): string {
        return `${this.startVertex.toString()} -> ${this.endVertex.toString()}: ${
            this.weight
        }`;
    }
}
