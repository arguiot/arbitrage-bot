import { BigNumber } from "ethers";

export type Quote = {
    amount: BigNumber; // Amount of tokenA
    amountOut: BigNumber; // Amount of tokenB
    price: number; // Price of tokenA in tokenB
};
