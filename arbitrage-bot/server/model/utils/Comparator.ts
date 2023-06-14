export default class Comparator<T> {
    private compare: (a: T, b: T) => number;

    constructor(compareFunction?: (a: T, b: T) => number) {
        this.compare = compareFunction || Comparator.defaultCompareFunction;
    }

    private static defaultCompareFunction<T>(a: T, b: T): number {
        if (a === b) {
            return 0;
        }

        return a < b ? -1 : 1;
    }

    public equal(a: T, b: T): boolean {
        return this.compare(a, b) === 0;
    }

    public lessThan(a: T, b: T): boolean {
        return this.compare(a, b) < 0;
    }

    public greaterThan(a: T, b: T): boolean {
        return this.compare(a, b) > 0;
    }

    public lessThanOrEqual(a: T, b: T): boolean {
        return this.lessThan(a, b) || this.equal(a, b);
    }

    public greaterThanOrEqual(a: T, b: T): boolean {
        return this.greaterThan(a, b) || this.equal(a, b);
    }

    public reverse(): void {
        const compareOriginal = this.compare;
        this.compare = (a, b) => compareOriginal(b, a);
    }
}
