import { ethers } from "ethers";
import { Token } from "../../scripts/exchanges/adapters/exchange";
import { Quote } from "../../scripts/exchanges/types/Quote";

export type PriceDataQuery = {
    exchange: string;
    tokenA: Token;
    tokenB: Token;
    wallet: ethers.Wallet;
    routerAddress?: string;
    factoryAddress?: string;
};

export type PriceData = {
    quote: Quote;
    exchange: string;
    tokenA: Token;
    tokenB: Token;
    balanceA: number;
    balanceB: number;
};
