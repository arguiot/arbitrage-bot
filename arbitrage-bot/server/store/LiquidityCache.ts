import { SharedMemory } from "./SharedMemory";

export class LiquidityCache {
    private sharedMemory: SharedMemory;

    constructor(sharedMemory: SharedMemory) {
        this.sharedMemory = sharedMemory;
    }

    get(exchange: string, token: string) {
        const cache = this.sharedMemory.getStore("liquidity-cache");
        // Return the value from the cache
        return cache[`${exchange}-${token}`];
    }

    async set(exchange: string, token: string, value: number) {
        const cache = this.sharedMemory.getStore("liquidity-cache");
        // Set the value in the cache
        cache[`${exchange}-${token}`] = value;
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
