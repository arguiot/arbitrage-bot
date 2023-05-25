import { BigNumber } from 'ethers';
import { Quote } from '../types/Quote';

export type Cost = {
    gas?: BigNumber;
    costInDollars: number;
}

export type Token = {
    name: string;
    address: string;
}

export interface Exchange<T> {
    // Properties
    delegate: T;
    // Methods
    getQuote(amount: number, tokenA: Token, tokenB: Token): Promise<Quote>; // Returns a quote for the given amount of tokenA
    estimateTransactionTime(amountIn: number, tokenA: Token, tokenB: Token): Promise<number>; // Returns the estimated time to execute a transaction
    estimateTransactionCost(amountIn: number, tokenA: Token, tokenB: Token, direction: "buy" | "sell"): Promise<Cost>; // Returns the estimated cost to execute a transaction in dollars

    // Swap methods
    swapExactTokensForTokens(amountIn: number, amountOutMin: number, path: Token[], to: string, deadline: number): Promise<void>; // Swaps an exact amount of tokens for another token

    // Liquidity methods
    liquidityFor(token: Token): Promise<number>; // Returns the liquidity for the given token
}
