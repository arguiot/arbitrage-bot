import { SharedMemory } from "./SharedMemory";

export class LiquidityCache {
    private sharedMemory: SharedMemory;

    constructor(sharedMemory: SharedMemory) {
        this.sharedMemory = sharedMemory;
    }

    get(exchange: string, token: string): number | undefined {
        const cache = this.sharedMemory.getStore("liquidity-cache");
        // Return the value from the cache
        const entry = cache[`${exchange}-${token}`];
        if (typeof entry === "undefined") {
            return undefined;
        }
        // If the cache is older than 1 minute, invalidate it
        if (Date.now() - entry.timestamp > 60 * 1000) {
            this.invalidate(exchange, token);
            return undefined;
        }
        return entry.value;
    }

    async set(exchange: string, token: string, value: number) {
        const cache = this.sharedMemory.getStore("liquidity-cache");
        // Set the value in the cache
        cache[`${exchange}-${token}`] = {
            value,
            timestamp: Date.now(),
        };
        // Save the cache to shared memory
        await this.sharedMemory.setStore("liquidity-cache", cache);
    }

    async invalidate(exchange: string, token: string) {
        const cache = this.sharedMemory.getStore("liquidity-cache");
        // Set the value in the cache
        delete cache[`${exchange}-${token}`];
        // Save the cache to shared memory
        await this.sharedMemory.setStore("liquidity-cache", cache);
    }
}
