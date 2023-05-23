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
    getQuote(amount: BigNumber, tokenA: Token, tokenB: Token): Promise<Quote>; // Returns a quote for the given amount of tokenA
    estimateTransactionTime(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<number>; // Returns the estimated time to execute a transaction
    estimateTransactionCost(amountIn: BigNumber, tokenA: Token, tokenB: Token, direction: "buy" | "sell"): Promise<Cost>; // Returns the estimated cost to execute a transaction in dollars

    // Swap methods
    swapExactTokensForTokens(amountIn: BigNumber, amountOutMin: BigNumber, path: string[], to: string, deadline: number): Promise<void>; // Swaps an exact amount of tokens for another token
}
