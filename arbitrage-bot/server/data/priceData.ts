import { ethers } from "ethers";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "./adapters";
import { Token } from "../types/request";
import { betSize } from "../../scripts/arbiter/betSize";
import { calculateProfitProbability } from "../../scripts/arbiter/profitChances";
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
    let balanceA = await liquidityCache.get(cacheName, tokenA.name);
    if (typeof balanceA === "undefined") {
        balanceA = await adapter.liquidityFor(tokenA);
        await liquidityCache.set(cacheName, tokenA.name, balanceA);
    }
    let balanceB = await liquidityCache.get(cacheName, tokenB.name);
    if (typeof balanceB === "undefined") {
        balanceB = await adapter.liquidityFor(tokenB);
        await liquidityCache.set(cacheName, tokenB.name, balanceB);
    }

    const priceDataStore = new PriceDataStore(memory);

    const arbitrage = priceDataStore.getArbitrageOpportunity() || {
        percentProfit: 0.9,
        profit: 1.09,
        exchange1: exchange,
        quote1: { ttf: 20 },
        quote2: { ttf: 20 },
    };
    const profitDelta = arbitrage.profit;
    const profitProbability = calculateProfitProbability({
        type: adapter.type,
        delta: arbitrage.profit,
        ttf:
            (arbitrage.exchange1 === exchange
                ? arbitrage.quote1.ttf
                : arbitrage.quote2.ttf) ?? 20,
    });
    const bet = betSize({
        profitProbability,
        profitDelta,
        maximumSlippage: 0.001, // 0.1% slippage (arbitrary)
        balance: balanceA,
    });

    await priceDataStore.addBetSize(exchange, bet);

    const maxAvailable = priceDataStore.getLowestBetSize();

    const quote = await adapter.getQuote(maxAvailable, tokenA, tokenB);

    priceDataStore.addQuote(exchange, quote);

    const ttf = await adapter.estimateTransactionTime(tokenA, tokenB);

    quote.ttf = ttf;

    return { quote, exchange, tokenA, tokenB, balanceA, balanceB };
}
