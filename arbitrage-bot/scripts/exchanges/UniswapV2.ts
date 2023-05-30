import { ethers, BigNumber, Contract, Wallet } from "ethers";
import { Exchange, Cost, Token } from "./adapters/exchange";
import { Quote } from "./types/Quote";
const IUniswapV2Pair = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");
const _UniswapV2Factory = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const _UniswapV2Router02 = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

export class UniswapV2 implements Exchange<Contract> {
    name = "uniswap";
    type: "dex" | "cex" = "dex";

    delegate: Contract;
    source: Contract;

    wallet: Wallet;

    constructor(
        delegate?: Contract | string,
        source?: Contract | string,
        wallet: Wallet = Wallet.createRandom()
    ) {
        if (delegate instanceof Contract) {
            this.delegate = delegate;
        } else {
            const routerAddress =
                delegate ?? "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
            this.delegate = new ethers.Contract(
                routerAddress,
                _UniswapV2Router02.abi,
                wallet
            );
        }
        if (source instanceof Contract) {
            this.source = source;
        } else {
            const factoryAddress =
                source ?? "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
            this.source = new ethers.Contract(
                factoryAddress,
                _UniswapV2Factory.abi,
                wallet
            );
        }
        this.wallet = wallet;
    }

    normalizeToken(token: Token): Token {
        // Convert ETH to WETH if necessary
        const wethAddress =
            process.env.WETH_CONTRACT_ADDRESS ??
            "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        if (token.address === ethers.constants.AddressZero) {
            return {
                name: "WETH",
                address: wethAddress,
            };
        }
        return token;
    }

    // MARK: - Smart Contract Methods
    sortTokens(tokenA: string, tokenB: string): [string, string] {
        if (tokenA === tokenB) {
            throw new Error("IDENTICAL_ADDRESSES");
        }
        const [token0, token1] =
            tokenA.toLowerCase() < tokenB.toLowerCase()
                ? [tokenA, tokenB]
                : [tokenB, tokenA];
        if (token0 === ethers.constants.AddressZero) {
            throw new Error("ZERO_ADDRESS");
        }
        return [token0, token1];
    }

    pairFor(factory: string, tokenA: string, tokenB: string): string {
        const [token0, token1] =
            tokenA.toLowerCase() < tokenB.toLowerCase()
                ? [tokenA, tokenB]
                : [tokenB, tokenA];
        const initCodeHash =
            "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
        const salt = ethers.utils.solidityKeccak256(
            ["address", "address"],
            [token0, token1]
        );
        const bytecode = `0xff${factory.slice(2)}${salt.slice(
            2
        )}${initCodeHash.slice(2)}`;
        const pair = ethers.utils.getAddress(
            `0x${ethers.utils.keccak256(bytecode).slice(-40)}`
        );
        return pair;
    }

    async getReserves(
        factory: string,
        tokenA: string,
        tokenB: string
    ): Promise<[BigNumber, BigNumber]> {
        const pair = new ethers.Contract(
            this.pairFor(factory, tokenA, tokenB),
            IUniswapV2Pair.abi,
            this.wallet.provider
        );
        const [reserve0, reserve1] = await pair.getReserves();
        const [token0] = this.sortTokens(tokenA, tokenB);
        return tokenA === token0 ? [reserve0, reserve1] : [reserve1, reserve0];
    }

    getAmountOut(
        amountIn: BigNumber,
        reserveIn: BigNumber,
        reserveOut: BigNumber
    ): BigNumber {
        if (amountIn.lte(0)) {
            throw new Error("INSUFFICIENT_INPUT_AMOUNT");
        }
        if (reserveIn.lte(0) || reserveOut.lte(0)) {
            throw new Error("INSUFFICIENT_LIQUIDITY");
        }
        const amountInWithFee = amountIn.mul(997);
        const numerator = amountInWithFee.mul(reserveOut);
        const denominator = reserveIn.mul(1000).add(amountInWithFee);
        const amountOut = numerator.div(denominator);
        return amountOut;
    }

    async getQuote(
        maxAvailableAmount: number,
        tokenA: Token,
        tokenB: Token
    ): Promise<Quote> {
        // Normalize the tokens
        tokenA = this.normalizeToken(tokenA);
        tokenB = this.normalizeToken(tokenB);
        // Get reserves
        const [reserveA, reserveB] = await this.getReserves(
            this.source.address,
            tokenA.address,
            tokenB.address
        );
        // Get the optimal amount In (amountIn = sqrt(k / (1 + fee)))
        const bestAmountIn = sqrt(
            reserveA
                .mul(reserveB)
                .mul(1000000)
                .div(1000000 + 3000)
        );

        // Amount in is the minimum between the max available amount (in ethers) and the best amount in (in wei)
        const amountIn = bestAmountIn.lt(
            ethers.utils.parseEther(maxAvailableAmount.toString())
        )
            ? bestAmountIn
            : ethers.utils.parseEther(maxAvailableAmount.toString());

        const _quote = this.getAmountOut(amountIn, reserveA, reserveB);
        // Convert back from wei to ether
        const quote = Number(
            ethers.utils.formatUnits(
                _quote,
                tokenA.name === "WETH" ? "mwei" : "ether"
            )
        );

        const amountInEther = Number(ethers.utils.formatEther(amountIn));

        const price = quote / amountInEther;

        return {
            amount: amountInEther,
            amountOut: quote,
            price,
            tokenA,
            tokenB,
            routerAddress: this.delegate.address,
            factoryAddress: this.source.address,
        };
    }

    async estimateTransactionTime(
        tokenA: Token,
        tokenB: Token
    ): Promise<number> {
        // Get the provider
        const provider = this.wallet.provider;

        // // Estimate gas required for the transaction
        // const { gas } = await this.estimateTransactionCost(
        //     1,
        //     0,
        //     tokenA,
        //     tokenB
        // ); // Here the price doesn't matter

        // Get the current block number
        const currentBlockNumber = await provider.getBlockNumber();

        // Get the average block time
        const currentBlock = await provider.getBlock(currentBlockNumber);
        const block = await provider.getBlock(currentBlockNumber - 10); // look back 10 blocks
        const averageBlockTime =
            (currentBlock.timestamp - block.timestamp) / 10;

        // Estimate the time for the transaction to be confirmed

        const estimatedTime = averageBlockTime; // To be improved

        return estimatedTime;
    }

    async estimateTransactionCost(
        amountIn: number,
        price: number,
        tokenA: Token,
        tokenB: Token
    ): Promise<Cost> {
        // Ask the delegate for the gas price using contract.estimateGas method in ethers.js
        // Use swapExactTokensForTokens or correct ETH method in the delegate contract to estimate the gas cost
        try {
            let cost = BigNumber.from(0);
            const deadline = BigNumber.from(
                Math.floor(Date.now() / 1000) + 60 * 20
            ); // 20 minutes from the current Unix time
            const address = this.wallet.address;
            const oneETH = ethers.utils.parseEther(amountIn.toString());

            // First convert ETH to WETH if necessary
            const wethAddress =
                process.env.WETH_CONTRACT_ADDRESS ??
                "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
            if (tokenA.address === ethers.constants.AddressZero) {
                tokenA = {
                    name: "WETH",
                    address: wethAddress,
                };
            }
            if (tokenB.address === ethers.constants.AddressZero) {
                tokenB = {
                    name: "WETH",
                    address: wethAddress,
                };
            }

            if (tokenA.address === wethAddress) {
                cost = await this.delegate.estimateGas.swapExactETHForTokens(
                    oneETH,
                    [tokenA.address, tokenB.address],
                    address,
                    deadline,
                    { value: amountIn }
                );
            } else if (tokenB.address === wethAddress) {
                cost = await this.delegate.estimateGas.swapExactTokensForETH(
                    oneETH,
                    amountIn,
                    [tokenA.address, tokenB.address],
                    address,
                    deadline
                );
            } else {
                cost = await this.delegate.estimateGas.swapExactTokensForTokens(
                    oneETH,
                    amountIn,
                    [tokenA.address, tokenB.address],
                    address,
                    deadline
                );
            }

            // MARK: - convert to dollars
            // Get the current price of ETH
            const provider = this.wallet.provider;
            const { maxPriorityFeePerGas } = await provider.getFeeData();
            // Multiply the gas cost by the price of ETH
            const gas = cost.mul(maxPriorityFeePerGas ?? 100); // 100 is the gas price
            const costInDollars = gas.toNumber() * price * 10e-9;

            return { costInDollars, gas };
        } catch (e) {
            return {
                gas: BigNumber.from(21000 * 100),
                costInDollars: 21000 * 100 * 4000 * 10e-9,
            }; // default gas
        }
    }

    async swapExactTokensForTokens(
        amountIn: number,
        amountOutMin: number,
        path: Token[],
        to: string,
        deadline: number
    ): Promise<void> {
        if (process.env.USE_TESTNET === "TRUE") {
            console.log({
                from: "uniswap",
                amountIn,
                amountOutMin,
                path,
            });
            return;
        }
        const amount = ethers.utils.parseEther(amountIn.toString());
        const amountOut = ethers.utils.parseEther(amountOutMin.toString());
        return await this.delegate.swapExactTokensForTokens(
            amount,
            amountOut,
            path.map((token) => token.address),
            to,
            deadline
        );
    }

    async liquidityFor(token: Token): Promise<number> {
        if (process.env.USE_TESTNET === "TRUE") {
            return 100;
        }
        // Returns the amount of token the wallet has.
        if (token.address === ethers.constants.AddressZero) {
            const balance = await this.wallet.getBalance();
            return Number(ethers.utils.formatEther(balance));
        }
        const contractAbi = [
            "function balanceOf(address) view returns (uint256)",
        ];
        const contract = new ethers.Contract(
            token.address,
            contractAbi,
            this.wallet
        );
        const balance = await contract.balanceOf(this.wallet.address);
        return Number(
            ethers.utils.formatUnits(
                balance,
                token.name == "WETH" ? "mwei" : "ether"
            )
        );
    }
}

function sqrt(number: BigNumber): BigNumber {
    const a = number.toBigInt();
    if (a < 0n)
        throw new Error("square root of negative numbers is not supported");
    if (a < 2n) return number;
    function newtonIteration(n: bigint, x0: bigint): bigint {
        const x1 = (n / x0 + x0) >> 1n;
        if (x0 === x1 || x0 === x1 - 1n) return x0;
        return newtonIteration(n, x1);
    }
    return BigNumber.from(newtonIteration(a, 1n));
}
