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
    let balanceA = await liquidityCache.get(exchange, tokenA.name);
    if (typeof balanceA === "undefined") {
        balanceA = await adapter.liquidityFor(tokenA);
        await liquidityCache.set(exchange, tokenA.name, balanceA);
    }
    let balanceB = await liquidityCache.get(exchange, tokenB.name);
    if (typeof balanceB === "undefined") {
        balanceB = await adapter.liquidityFor(tokenB);
        await liquidityCache.set(exchange, tokenB.name, balanceB);
    }

    const priceDataStore = new PriceDataStore(memory);

    const arbitrage = priceDataStore.getArbitrageOpportunity();
    let bet = 0.5;
    if (arbitrage) {
        const profitDelta = arbitrage.percentProfit;
        const profitProbability = calculateProfitProbability({
            type: adapter.type,
            delta: profitDelta,
            ttf:
                (arbitrage.exchange1 === exchange
                    ? arbitrage.quote1.ttf
                    : arbitrage.quote2.ttf) ?? 20,
        });
        bet = betSize({
            profitProbability,
            profitDelta,
            maximumSlippage: 0.001, // 0.1% slippage (arbitrary)
        });
    } else {
        bet = betSize({
            profitProbability: 0.9, // 90% chance of success (arbitrary)
            profitDelta: 0.01, // 1% profit (arbitrary)
            maximumSlippage: 0.001, // 0.1% slippage (arbitrary)
        });
    }

    const size = balanceA * (bet <= 0 ? 0.5 : bet);

    await priceDataStore.addBetSize(exchange, size);

    const maxAvailable = priceDataStore.getLowestBetSize();

    const quote = await adapter.getQuote(maxAvailable, tokenA, tokenB);

    priceDataStore.addQuote(exchange, quote);

    const ttf = await adapter.estimateTransactionTime(tokenA, tokenB);

    quote.ttf = ttf;

    return { quote, exchange, tokenA, tokenB, balanceA, balanceB };
}
