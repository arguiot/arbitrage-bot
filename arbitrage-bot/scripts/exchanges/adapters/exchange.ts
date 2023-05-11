import { BigNumber } from 'ethers';
import { Quote } from '../types/Quote';

export type Cost = {
    gas?: BigNumber;
    costInDollars: number;
}

export interface Exchange<T> {
    // Properties
    delegate: T;
    // Methods
    getQuote(amount: BigNumber, tokenA: string, tokenB: string): Promise<Quote>; // Returns a quote for the given amount of tokenA
    estimateTransactionTime(amountIn: BigNumber, tokenA: string, tokenB: string): Promise<number>; // Returns the estimated time to execute a transaction
    estimateTransactionCost(amountIn: BigNumber, tokenA: string, tokenB: string): Promise<Cost>; // Returns the estimated cost to execute a transaction in dollars
}
