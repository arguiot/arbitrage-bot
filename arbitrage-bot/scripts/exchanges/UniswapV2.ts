import { ethers, BigNumber, Contract } from "ethers";
import { Exchange, Cost } from "./adapters/exchange";
import { Quote } from "./types/Quote";
import IUniswapV2Pair from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
export class UniswapV2 implements Exchange<Contract> {
    delegate: Contract;
    source: Contract;

    constructor(delegate: Contract, source: Contract) {
        this.delegate = delegate;
        this.source = source;
    }

    async getQuote(amountIn: BigNumber, tokenA: string, tokenB: string): Promise<Quote> {
        // Get reserves
        const pairAddress = await this.source.getPair(tokenA, tokenB);

        const pair = new ethers.Contract(pairAddress, IUniswapV2Pair.abi, this.source.signer);
        const reserves = await pair.getReserves();
        const reserveA = reserves[0];
        const reserveB = reserves[1];

        // Get quote
        const quote = await this.delegate.getAmountOut(amountIn, reserveA, reserveB);

        return {
            amount: amountIn,
            amountOut: quote,
            price: amountIn.toNumber() / quote.toNumber()
        };
    }

    async estimateTransactionTime(amountIn: BigNumber, tokenA: string, tokenB: string): Promise<number> {
        // Get the provider
        const provider = ethers.getDefaultProvider();

        // Estimate gas required for the transaction
        const { gas } = await this.estimateTransactionCost(amountIn, tokenA, tokenB);

        // Get the current block number
        const currentBlockNumber = await provider.getBlockNumber();

        // Get the average block time
        const currentBlock = await provider.getBlock(currentBlockNumber);
        const block = await provider.getBlock(currentBlockNumber - 10); // look back 10 blocks
        const averageBlockTime = (currentBlock.timestamp - block.timestamp) / 10;

        // Estimate the time for the transaction to be confirmed

        const estimatedTime = (averageBlockTime * gas.toNumber()) / 100;

        return estimatedTime;
    }

    async estimateTransactionCost(amountIn: BigNumber, tokenA: string, tokenB: string): Promise<Cost> {
        // Ask the delegate for the gas price using contract.estimateGas method in ethers.js
        // Use swapExactTokensForTokens or correct ETH method in the delegate contract to estimate the gas cost
        try {
            let cost = BigNumber.from(0);
            if (tokenA === "0x0000000000000000000000000000000000000000") {
                cost = await this.delegate.estimateGas.swapExactETHForTokens(0, [tokenA, tokenB], ethers.constants.AddressZero, 0);
            } else if (tokenB === "0x0000000000000000000000000000000000000000") {
                cost = await this.delegate.estimateGas.swapExactTokensForETH(0, [tokenA, tokenB], ethers.constants.AddressZero, 0);
            } else {
                cost = await this.delegate.estimateGas.swapExactTokensForTokens(0, 0, [tokenA, tokenB], ethers.constants.AddressZero, 0);
            }

            const gas = cost * 100; // 100 is the gas price

            // MARK: - convert to dollars
            // Get the current price of ETH
            const provider = ethers.getDefaultProvider();
            const price = await provider.getEtherPrice();
            // Multiply the gas cost by the price of ETH
            const costInDollars = gas * price * 10e-9;

            return { costInDollars, gas };
        }
        catch (e) {
            // console.log(e);
            return { gas: BigNumber.from(21000 * 100), costInDollars: BigNumber.from(21000 * 100 * 4000 * 10e-9) }; // default gas
        }
    }
}
