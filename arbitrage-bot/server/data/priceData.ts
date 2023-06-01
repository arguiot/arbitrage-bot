import { ethers } from "ethers";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "./adapters";
import { Token } from "../types/request";
import { betSize } from "../../scripts/arbiter/betSize";
import { calculateProfitProbability } from "../../scripts/arbiter/profitChances";

export class LiquidityCache {
    static shared = new LiquidityCache();
    cache = new Map<string, number>();

    get(exchange: string, token: string) {
        return this.cache.get(`${exchange}-${token}`);
    }

    set(exchange: string, token: string, value: number) {
        this.cache.set(`${exchange}-${token}`, value);
    }

    invalidate(exchange: string, token: string) {
        this.cache.delete(`${exchange}-${token}`);
    }
}

export default async function priceData({
    exchange,
    tokenA,
    tokenB,
    wallet,
    routerAddress,
    factoryAddress,
}: {
    exchange: string;
    tokenA: Token;
    tokenB: Token;
    wallet: ethers.Wallet;
    routerAddress?: string;
    factoryAddress?: string;
}) {
    const adapter = getAdapter(exchange, wallet, routerAddress, factoryAddress);

    let balanceA = LiquidityCache.shared.get(exchange, tokenA.name);
    if (typeof balanceA === "undefined") {
        balanceA = await adapter.liquidityFor(tokenA);
        LiquidityCache.shared.set(exchange, tokenA.name, balanceA);
    }
    let balanceB = LiquidityCache.shared.get(exchange, tokenB.name);
    if (typeof balanceB === "undefined") {
        balanceB = await adapter.liquidityFor(tokenB);
        LiquidityCache.shared.set(exchange, tokenB.name, balanceB);
    }

    const amounts = Array.from(PriceDataStore.shared.quotes.values()).map(
        (quote) => quote.amount
    );

    const arbitrage = PriceDataStore.shared.getArbitrageOpportunity();
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

    PriceDataStore.shared.addBetSize(exchange, size);

    const maxAvailable = PriceDataStore.shared.getLowestBetSize();

    const quote = await adapter.getQuote(maxAvailable, tokenA, tokenB);

    PriceDataStore.shared.addQuote(exchange, quote);

    const ttf = await adapter.estimateTransactionTime(tokenA, tokenB);

    quote.ttf = ttf;

    return { quote, exchange, tokenA, tokenB, balanceA, balanceB };
}
