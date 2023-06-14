export default class LinkedListNode<T> {
    public value: T;
    public next: LinkedListNode<T> | null;

    constructor(value: T, next: LinkedListNode<T> | null = null) {
        this.value = value;
        this.next = next;
    }

    public toString(callback?: (value: T) => string): string {
        return callback ? callback(this.value) : `${this.value}`;
    }
}
