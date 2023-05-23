import { BigNumber } from "ethers";
import { Token } from "../adapters/exchange";

export type Quote = {
    amount: BigNumber; // Amount of tokenA
    amountOut: number; // Amount of tokenB
    price: number; // Price of tokenA in tokenB
    tokenA: Token;
    tokenB: Token;
    ask?: number;
    bid?: number;
};
