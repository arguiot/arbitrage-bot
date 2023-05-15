import { BigNumber } from "ethers";
import { Exchange, Cost, Token } from "./adapters/exchange";
import { Quote } from "./types/Quote";
import { version, exchanges, Exchange as CCXTExchange } from 'ccxt';

export class LiveCEX implements Exchange<CCXTExchange> {
    delegate: CCXTExchange;

    constructor(exchange: keyof typeof exchanges) {
        this.delegate = new exchanges[exchange]() as unknown as CCXTExchange;
    }

    async getQuote(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<Quote> {
        const price = await this.delegate.fetchTicker(`${tokenA.name}/${tokenB.name}`);
        return {
            amount: amountIn,
            amountOut: BigNumber.from(Math.floor(amountIn.toNumber() * (price.last ?? 0))),
            price: price.last ?? 0,
            bid: price.bid ?? 0,
            ask: price.ask ?? 0,
        }
    }

    async estimateTransactionTime(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<number> {
        // Random time in ms, between 1-3 seconds
        return Math.random() * 2000 + 1000;
    }

    async estimateTransactionCost(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<Cost> {
        // Random cost in wei, between 0.001-0.01 ETH
        return { costInDollars: Math.random() * 0.009 + 0.001 };
    }
}
