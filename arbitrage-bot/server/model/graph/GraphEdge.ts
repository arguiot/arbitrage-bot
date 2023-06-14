import GraphVertex from "./GraphVertex";

export default class GraphEdge<T> {
    public startVertex: GraphVertex<T>;
    public endVertex: GraphVertex<T>;
    public weight: number;

    constructor(
        startVertex: GraphVertex<T>,
        endVertex: GraphVertex<T>,
        weight = 0
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

    public reverse(): GraphEdge<T> {
        const tmp = this.startVertex;
        this.startVertex = this.endVertex;
        this.endVertex = tmp;

        return this;
    }

    public toString(): string {
        return this.getKey();
    }
}
