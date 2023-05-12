import { BigNumber } from "ethers";
import { Exchange, Cost } from "./adapters/exchange";
import { Quote } from "./types/Quote";

export class FakeCEX implements Exchange<null> {
    delegate: null;

    constructor() {
        this.delegate = null;
    }

    async getQuote(amountIn: BigNumber, tokenA: string, tokenB: string): Promise<Quote> {
        const price = Math.ceil((Math.random() * 0.02 + 0.9) * 10e9);
        return {
            amount: amountIn,
            amountOut: amountIn.mul(BigNumber.from(price)),
            price: price
        }
    }

    async estimateTransactionTime(amountIn: BigNumber, tokenA: string, tokenB: string): Promise<number> {
        // Random time in ms, between 1-3 seconds
        return Math.random() * 2000 + 1000;
    }

    async estimateTransactionCost(amountIn: BigNumber, tokenA: string, tokenB: string): Promise<Cost> {
        // Random cost in wei, between 0.001-0.01 ETH
        return { costInDollars: Math.random() * 0.009 + 0.001 };
    }
}
