import LinkedList from "../linked-list/LinkedList";
import GraphEdge from "./GraphEdge";

export default class GraphVertex<T, U> {
    public value: T;
    edges: LinkedList<GraphEdge<T, U>>;

    constructor(value: T) {
        if (value === undefined) {
            throw new Error("Graph vertex must have a value");
        }

        const edgeComparator = (
            edgeA: GraphEdge<T, U>,
            edgeB: GraphEdge<T, U>
        ) => {
            if (edgeA.getKey() === edgeB.getKey()) {
                return 0;
            }

            return edgeA.getKey() < edgeB.getKey() ? -1 : 1;
        };

        this.value = value;
        this.edges = new LinkedList<GraphEdge<T, U>>(edgeComparator);
    }

    public addEdge(edge: GraphEdge<T, U>): GraphVertex<T, U> {
        this.edges.append(edge);
        return this;
    }

    public deleteEdge(edge: GraphEdge<T, U>): void {
        this.edges.delete(edge);
    }

    public getNeighbors(): GraphVertex<T, U>[] {
        const edges = this.edges.toArray();

        const neighborsConverter = (node: { value: GraphEdge<T, U> }) => {
            return node.value.startVertex === this
                ? node.value.endVertex
                : node.value.startVertex;
        };

        return edges.map(neighborsConverter);
    }

    public getEdges(): GraphEdge<T, U>[] {
        return this.edges
            .toArray()
            .map((linkedListNode) => linkedListNode.value);
    }

    public getDegree(): number {
        return this.edges.toArray().length;
    }

    public hasEdge(requiredEdge: GraphEdge<T, U>): boolean {
        const edgeNode = this.edges.find({
            callback: (edge) => edge === requiredEdge,
        });

        return !!edgeNode;
    }

    public hasNeighbor(vertex: GraphVertex<T, U>): boolean {
        const vertexNode = this.edges.find({
            callback: (edge) =>
                edge.startVertex === vertex || edge.endVertex === vertex,
        });

        return !!vertexNode;
    }

    public findEdge(vertex: GraphVertex<T, U>): GraphEdge<T, U> | null {
        const edgeFinder = (edge: GraphEdge<T, U>) => {
            return edge.startVertex === vertex || edge.endVertex === vertex;
        };

        const edge = this.edges.find({ callback: edgeFinder });

        return edge ? edge.value : null;
    }

    public getKey(): string {
        return `${this.value}`;
    }

    public deleteAllEdges(): GraphVertex<T, U> {
        this.getEdges().forEach((edge) => this.deleteEdge(edge));

        return this;
    }

    public toString(callback?: (value: T) => string): string {
        return callback ? callback(this.value) : `${this.value}`;
    }
}
