import { BigNumber } from "ethers";
import { Exchange, Cost } from "./adapters/exchange";
import { Quote } from "./types/Quote";

export class FakeCEX implements Exchange<null> {
    delegate: null;

    constructor() {
        this.delegate = null;
    }

    async getQuote(
        amountIn: BigNumber,
        tokenA: Token,
        tokenB: Token
    ): Promise<Quote> {
        const price = Math.ceil((Math.random() * 0.02 + 0.9) * 10e9);
        return {
            amount: amountIn,
            amountOut: amountIn.toNumber() * price,
            price: price,
            tokenA,
            tokenB,
        };
    }

    async estimateTransactionTime(
        amountIn: BigNumber,
        tokenA: Token,
        tokenB: Token
    ): Promise<number> {
        // Random time in ms, between 1-3 seconds
        return Math.random() * 2000 + 1000;
    }

    async estimateTransactionCost(
        amountIn: BigNumber,
        tokenA: Token,
        tokenB: Token
    ): Promise<Cost> {
        // Random cost in wei, between 0.001-0.01 ETH
        return { costInDollars: Math.random() * 0.009 + 0.001 };
    }

    swapExactTokensForTokens(
        amountIn: BigNumber,
        amountOutMin: BigNumber,
        path: string[],
        to: string,
        deadline: number
    ): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
