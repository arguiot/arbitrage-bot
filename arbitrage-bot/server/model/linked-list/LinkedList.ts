import LinkedListNode from "./LinkedListNode";
import Comparator from "../utils/Comparator";

export default class LinkedList<T> {
    public head: LinkedListNode<T> | null;
    public tail: LinkedListNode<T> | null;
    private compare: Comparator<T>;

    constructor(comparatorFunction?: (a: T, b: T) => number) {
        this.head = null;
        this.tail = null;
        this.compare = new Comparator(comparatorFunction);
    }

    public prepend(value: T): LinkedList<T> {
        const newNode = new LinkedListNode(value, this.head);
        this.head = newNode;

        if (!this.tail) {
            this.tail = newNode;
        }

        return this;
    }

    public append(value: T): LinkedList<T> {
        const newNode = new LinkedListNode(value);

        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;

            return this;
        }

        if (this.tail) {
            this.tail.next = newNode;
        }
        this.tail = newNode;

        return this;
    }

    public insert(value: T, rawIndex: number): LinkedList<T> {
        const index = rawIndex < 0 ? 0 : rawIndex;
        if (index === 0) {
            this.prepend(value);
        } else {
            let count = 1;
            let currentNode = this.head;
            const newNode = new LinkedListNode(value);
            while (currentNode) {
                if (count === index) break;
                currentNode = currentNode.next;
                count += 1;
            }
            if (currentNode) {
                newNode.next = currentNode.next;
                currentNode.next = newNode;
            } else {
                if (this.tail) {
                    this.tail.next = newNode;
                    this.tail = newNode;
                } else {
                    this.head = newNode;
                    this.tail = newNode;
                }
            }
        }
        return this;
    }

    public delete(value: T): LinkedListNode<T> | null {
        if (!this.head) {
            return null;
        }

        let deletedNode = null;

        while (this.head && this.compare.equal(this.head.value, value)) {
            deletedNode = this.head;
            this.head = this.head.next;
        }

        let currentNode = this.head;

        if (currentNode !== null) {
            while (currentNode.next) {
                if (this.compare.equal(currentNode.next.value, value)) {
                    deletedNode = currentNode.next;
                    currentNode.next = currentNode.next.next;
                } else {
                    currentNode = currentNode.next;
                }
            }
        }

        if (this.tail && this.compare.equal(this.tail.value, value)) {
            this.tail = currentNode;
        }

        return deletedNode;
    }

    public find(params: {
        value?: T;
        callback?: (value: T) => boolean;
    }): LinkedListNode<T> | null {
        if (!this.head) {
            return null;
        }

        let currentNode: LinkedListNode<T> | null = this.head;

        while (currentNode) {
            if (params.callback && params.callback(currentNode.value)) {
                return currentNode;
            }

            if (
                params.value !== undefined &&
                this.compare.equal(currentNode.value, params.value)
            ) {
                return currentNode;
            }

            currentNode = currentNode.next;
        }

        return null;
    }

    public deleteTail(): LinkedListNode<T> | null {
        const deletedTail = this.tail;

        if (this.head === this.tail) {
            this.head = null;
            this.tail = null;

            return deletedTail;
        }

        let currentNode = this.head;
        while (currentNode?.next) {
            if (!currentNode.next.next) {
                currentNode.next = null;
            } else {
                currentNode = currentNode.next;
            }
        }

        this.tail = currentNode;

        return deletedTail;
    }

    public deleteHead(): LinkedListNode<T> | null {
        if (!this.head) {
            return null;
        }

        const deletedHead = this.head;

        if (this.head.next) {
            this.head = this.head.next;
        } else {
            this.head = null;
            this.tail = null;
        }

        return deletedHead;
    }

    public fromArray(values: T[]): LinkedList<T> {
        values.forEach((value) => this.append(value));

        return this;
    }

    public toArray(): LinkedListNode<T>[] {
        const nodes: LinkedListNode<T>[] = [];

        let currentNode = this.head;
        while (currentNode) {
            nodes.push(currentNode);
            currentNode = currentNode.next;
        }

        return nodes;
    }

    public toString(callback?: (value: T) => string): string {
        return this.toArray()
            .map((node) => node.toString(callback))
            .toString();
    }

    public reverse(): LinkedList<T> {
        let currNode = this.head;
        let prevNode: LinkedListNode<T> | null = null;
        let nextNode: LinkedListNode<T> | null = null;

        while (currNode) {
            nextNode = currNode.next;
            currNode.next = prevNode;
            prevNode = currNode;
            currNode = nextNode;
        }

        this.tail = this.head;
        this.head = prevNode;

        return this;
    }
}
