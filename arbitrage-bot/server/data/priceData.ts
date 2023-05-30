import { ethers } from "ethers";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "./adapters";
import { Token } from "../types/request";

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

    const amounts = Array.from(PriceDataStore.shared.quotes.values()).map(quote => quote.amount);
    const maxAvailable = Math.min(...amounts, balanceA);

    const quote = await adapter.getQuote(maxAvailable, tokenA, tokenB);

    PriceDataStore.shared.addQuote(exchange, quote);

    const ttf = await adapter.estimateTransactionTime(tokenA, tokenB);

    return { quote, exchange, ttf, tokenA, tokenB, balanceA, balanceB };
}
