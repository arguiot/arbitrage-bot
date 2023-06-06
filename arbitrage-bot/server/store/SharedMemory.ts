export class SharedMemory {
    store: SharedArrayBuffer;

    constructor(store?: SharedArrayBuffer) {
        this.store = store || new SharedArrayBuffer(1024 * 1024); // 1MB
    }

    getStore(name: string): any {
        const decoder = new TextDecoder();
        const view = new Uint8Array(this.store);
        const int32View = new Int32Array(this.store);
        const length = Atomics.load(int32View, 0);
        const decoded = decoder.decode(view.slice(4, length + 4));
        if (decoded === "") {
            return {};
        }
        try {
            const parsed = JSON.parse(decoded);
            return parsed[`${name}`] || {};
        } catch (e) {
            console.error("ERROR", decoded, e);
            return {};
        }
    }

    async setStore(name: string, value: any): Promise<void> {
        const encoder = new TextEncoder();
        const view = new Uint8Array(this.store);
        const int32View = new Int32Array(this.store);

        // Lock int32View[0] to prevent simultaneous access
        const v0 = int32View[0];
        // @ts-expect-error
        await Atomics.waitAsync(int32View, 0, v0);

        const decoded = new TextDecoder().decode(
            view.slice(4, int32View[0] + 4)
        );
        const parsed = decoded ? JSON.parse(decoded) : {};
        parsed[`${name}`] = value;

        const string = JSON.stringify(parsed);
        const encoded = encoder.encode(string);

        // Check for overflow
        if (encoded.length > view.length - 4) {
            throw new Error("Shared memory overflow");
        }

        // Write length and content
        Atomics.store(int32View, 0, encoded.length);
        view.set(encoded, 4);

        // Unlock int32View[0]
        Atomics.notify(int32View, 0, 1);
    }
}
