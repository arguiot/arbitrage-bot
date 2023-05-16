import { ethers, BigNumber, Contract } from "ethers";
import { Exchange, Cost, Token } from "./adapters/exchange";
import { Quote } from "./types/Quote";
import IUniswapV2Pair from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
import _UniswapV2Factory from "@uniswap/v2-core/build/UniswapV2Factory.json";
import _UniswapV2Router02 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";

export class UniswapV2 implements Exchange<Contract> {
    delegate: Contract;
    source: Contract;

    constructor(delegate?: Contract, source?: Contract, provider: ethers.providers.Provider = ethers.getDefaultProvider()) {
        if (delegate) {
            this.delegate = delegate;
        } else {
            const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
            this.delegate = new ethers.Contract(routerAddress, _UniswapV2Router02.abi, provider);
        }
        if (source) {
            this.source = source;
        } else {
            const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
            this.source = new ethers.Contract(factoryAddress, _UniswapV2Factory.abi, provider);
        }
    }

    async getQuote(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<Quote> {
        // First convert ETH to WETH if necessary
        const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        if (tokenA.address === ethers.constants.AddressZero) {
            tokenA = {
                name: "WETH",
                address: wethAddress,
            }
        }
        if (tokenB.address === ethers.constants.AddressZero) {
            tokenB = {
                name: "WETH",
                address: wethAddress,
            }
        }
        // Get quote
        const _quote = await this.delegate.getAmountsOut(ethers.utils.parseEther(amountIn.toString()), [
            tokenB.address,
            tokenA.address
        ]);
        // Convert back from wei to ether
        const quote = Number(ethers.utils.formatEther(
            _quote[1] // amountOut
        ));

        // For the price, we need to order the tokens by their symbol. If tokenA is first, then the price is amountIn / quote otherwise it's quote / amountIn
        let price;
        if (tokenA.name.localeCompare(tokenB.name) === 0) {
            price = amountIn.toNumber() / quote;
        } else {
            price = quote / amountIn.toNumber();
        }

        return {
            amount: amountIn,
            amountOut: quote,
            price
        };
    }

    async estimateTransactionTime(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<number> {
        // Get the provider
        const provider = ethers.getDefaultProvider();

        // Estimate gas required for the transaction
        const { gas } = await this.estimateTransactionCost(amountIn, tokenA.address, tokenB.address);

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

    async estimateTransactionCost(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<Cost> {
        // Ask the delegate for the gas price using contract.estimateGas method in ethers.js
        // Use swapExactTokensForTokens or correct ETH method in the delegate contract to estimate the gas cost
        try {
            let cost = BigNumber.from(0);
            if (tokenA === "0x0000000000000000000000000000000000000000") {
                cost = await this.delegate.estimateGas.swapExactETHForTokens(0, [tokenA.address, tokenB.address], ethers.constants.AddressZero, 0);
            } else if (tokenB === "0x0000000000000000000000000000000000000000") {
                cost = await this.delegate.estimateGas.swapExactTokensForETH(0, [tokenA.address, tokenB.address], ethers.constants.AddressZero, 0);
            } else {
                cost = await this.delegate.estimateGas.swapExactTokensForTokens(0, 0, [tokenA.address, tokenB.address], ethers.constants.AddressZero, 0);
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
