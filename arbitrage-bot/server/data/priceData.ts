import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "./adapters";
import { LiquidityCache } from "../store/LiquidityCache";
import { SharedMemory } from "../store/SharedMemory";
import { PriceDataQuery, PriceData } from "../types/priceDataQuery";

export default async function priceData(
    memory: SharedMemory,
    {
        exchange,
        tokenA,
        tokenB,
        wallet,
        routerAddress,
        factoryAddress,
    }: PriceDataQuery
): Promise<PriceData> {
    const adapter = getAdapter(exchange, wallet, routerAddress, factoryAddress);

    const liquidityCache = new LiquidityCache(memory);
    const cacheName = adapter.type === "dex" ? "dex" : exchange;
    let balanceA = liquidityCache.get(cacheName, tokenA.name);
    if (typeof balanceA === "undefined") {
        balanceA = await adapter.liquidityFor(tokenA);
        await liquidityCache.set(cacheName, tokenA.name, balanceA);
    }
    let balanceB = liquidityCache.get(cacheName, tokenB.name);
    if (typeof balanceB === "undefined") {
        balanceB = await adapter.liquidityFor(tokenB);
        await liquidityCache.set(cacheName, tokenB.name, balanceB);
    }

    const priceDataStore = new PriceDataStore(memory);

    const maxAvailable = balanceA; // We can only buy as much as we have

    const quote = await adapter.getQuote(maxAvailable, tokenA, tokenB, true);

    priceDataStore.addQuote(exchange, tokenA, tokenB, quote);

    const ttf = await adapter.estimateTransactionTime(tokenA, tokenB);

    quote.ttf = ttf;

    return { quote, exchange, tokenA, tokenB, balanceA, balanceB };
}
