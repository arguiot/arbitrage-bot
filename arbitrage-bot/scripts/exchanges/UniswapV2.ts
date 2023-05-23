import { ethers, BigNumber, Contract, Wallet } from "ethers";
import { Exchange, Cost, Token } from "./adapters/exchange";
import { Quote } from "./types/Quote";
const IUniswapV2Pair = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");
const _UniswapV2Factory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const _UniswapV2Router02 = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

export class UniswapV2 implements Exchange<Contract> {
    delegate: Contract;
    source: Contract;

    constructor(delegate?: Contract, source?: Contract, wallet?: Wallet = Wallet.createRandom()) {
        if (delegate) {
            this.delegate = delegate;
        } else {
            const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
            this.delegate = new ethers.Contract(routerAddress, _UniswapV2Router02.abi, wallet);
        }
        if (source) {
            this.source = source;
        } else {
            const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
            this.source = new ethers.Contract(factoryAddress, _UniswapV2Factory.abi, wallet);
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
        const _quote = await this.delegate.getAmountsOut(
            ethers.utils.parseEther(amountIn.toString()),
            [tokenA.address, tokenB.address]
        );
        // Convert back from wei to ether
        const quote = Number(ethers.utils.formatUnits(_quote[1], tokenA.name == "WETH" ? "mwei" : "ether"));
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
            price,
            tokenA,
            tokenB,
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
            const deadline = BigNumber.from(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes from the current Unix time
            const address = "0x492804D7740150378BE8d4bBF8ce012C5497DeA9"; // My own address, but it doesn't matter for this
            const oneETH = ethers.utils.parseEther("1");

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

            if (tokenA.address === wethAddress) {
                cost = await this.delegate.estimateGas.swapExactETHForTokens(oneETH, [tokenA.address, tokenB.address], address, deadline, { value: amountIn });
            } else if (tokenB.address === wethAddress) {
                cost = await this.delegate.estimateGas.swapExactTokensForETH(oneETH, amountIn, [tokenA.address, tokenB.address], address, deadline);
            } else {
                cost = await this.delegate.estimateGas.swapExactTokensForTokens(oneETH, amountIn, [tokenA.address, tokenB.address], address, deadline);
            }

            // MARK: - convert to dollars
            // Get the current price of ETH
            const provider = ethers.getDefaultProvider();
            const price = await provider.getEtherPrice();
            const { maxPriorityFeePerGas } = await provider.getFeeData();
            // Multiply the gas cost by the price of ETH
            const gas = cost.mul(maxPriorityFeePerGas ?? 100); // 100 is the gas price
            const costInDollars = gas.toNumber() * price * 10e-9;

            return { costInDollars, gas };
        }
        catch (e) {
            console.error(e);
            return { gas: BigNumber.from(21000 * 100), costInDollars: 21000 * 100 * 4000 * 10e-9 }; // default gas
        }
    }

    async swapExactTokensForTokens(amountIn: ethers.BigNumber, amountOutMin: ethers.BigNumber, path: string[], to: string, deadline: number): Promise<void> {
        return await this.delegate.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);
    }
}
