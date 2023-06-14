import LinkedList from "../linked-list/LinkedList";
import GraphEdge from "./GraphEdge";

export default class GraphVertex<T> {
    public value: T;
    edges: LinkedList<GraphEdge<T>>;

    constructor(value: T) {
        if (value === undefined) {
            throw new Error("Graph vertex must have a value");
        }

        const edgeComparator = (edgeA: GraphEdge<T>, edgeB: GraphEdge<T>) => {
            if (edgeA.getKey() === edgeB.getKey()) {
                return 0;
            }

            return edgeA.getKey() < edgeB.getKey() ? -1 : 1;
        };

        this.value = value;
        this.edges = new LinkedList<GraphEdge<T>>(edgeComparator);
    }

    public addEdge(edge: GraphEdge<T>): GraphVertex<T> {
        this.edges.append(edge);
        return this;
    }

    public deleteEdge(edge: GraphEdge<T>): void {
        this.edges.delete(edge);
    }

    public getNeighbors(): GraphVertex<T>[] {
        const edges = this.edges.toArray();

        const neighborsConverter = (node: { value: GraphEdge<T> }) => {
            return node.value.startVertex === this
                ? node.value.endVertex
                : node.value.startVertex;
        };

        return edges.map(neighborsConverter);
    }

    public getEdges(): GraphEdge<T>[] {
        return this.edges
            .toArray()
            .map((linkedListNode) => linkedListNode.value);
    }

    public getDegree(): number {
        return this.edges.toArray().length;
    }

    public hasEdge(requiredEdge: GraphEdge<T>): boolean {
        const edgeNode = this.edges.find({
            callback: (edge) => edge === requiredEdge,
        });

        return !!edgeNode;
    }

    public hasNeighbor(vertex: GraphVertex<T>): boolean {
        const vertexNode = this.edges.find({
            callback: (edge) =>
                edge.startVertex === vertex || edge.endVertex === vertex,
        });

        return !!vertexNode;
    }

    public findEdge(vertex: GraphVertex<T>): GraphEdge<T> | null {
        const edgeFinder = (edge: GraphEdge<T>) => {
            return edge.startVertex === vertex || edge.endVertex === vertex;
        };

        const edge = this.edges.find({ callback: edgeFinder });

        return edge ? edge.value : null;
    }

    public getKey(): string {
        return `${this.value}`;
    }

    public deleteAllEdges(): GraphVertex<T> {
        this.getEdges().forEach((edge) => this.deleteEdge(edge));

        return this;
    }

    public toString(callback?: (value: T) => string): string {
        return callback ? callback(this.value) : `${this.value}`;
    }
}
