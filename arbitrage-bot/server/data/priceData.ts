import { BigNumber } from "ethers";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "./adapters";


class LiquidityCache {
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

export default async function priceData({ exchange, tokenA, tokenB, wallet }) {
    const adapter = getAdapter(exchange, wallet);

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

    const quote = await adapter.getQuote(
        balanceA,
        tokenA,
        tokenB
    );

    PriceDataStore.shared.addQuote(exchange, quote);

    const ttf = await adapter.estimateTransactionTime(
        BigNumber.from(1),
        tokenA,
        tokenB
    )

    return { quote, exchange, ttf, tokenA, tokenB, balanceA, balanceB };
}
