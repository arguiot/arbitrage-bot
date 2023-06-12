import { Actor, PartialResult } from "./actor";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "../data/adapters";
import { calculateProfitProbability } from "../../src/arbiter/profitChances";
import Credentials from "../credentials/Credentials";
import { Opportunity } from "../types/opportunity";
import { LiquidityCache } from "../store/LiquidityCache";
import { CexData, UniData, betSize } from "../../src/arbiter/betSize";
import { ServerWebSocket } from "../types/socket";
import { SharedMemory } from "../store/SharedMemory";
import PriceDataWorker from "./priceDataWorker";
import { BigNumber } from "ethers";
import { UniswapV2 } from "../../src/exchanges/UniswapV2";
import { Receipt } from "../../src/exchanges/adapters/exchange";

type DecisionOptions = {
    ws: ServerWebSocket;
    onChainPeers: Map<string, PriceDataWorker>;
    offChainPeers: Map<string, PriceDataWorker>;
};
export default class Decision implements Actor<DecisionOptions> {
    locked = false;
    softLocked = false;

    memory: SharedMemory;

    constructor(memory: SharedMemory) {
        this.memory = memory;
    }

    // MARK: - Event handler
    async receive({
        ws,
        onChainPeers,
        offChainPeers,
    }: DecisionOptions): Promise<PartialResult> {
        if (this.softLocked || this.locked) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Locked",
            };
        }

        const priceDataStore = new PriceDataStore(this.memory);
        const liquidityCache = new LiquidityCache(this.memory);
        // First, let's get the opportunities
        const opportunity =
            (await priceDataStore.getArbitrageOpportunity()) as Opportunity;

        if (!opportunity) {
            console.log("No opportunity");
            return {
                topic: "decision",
                opportunity: undefined,
            };
        }

        const exchange1 = getAdapter(
            opportunity.exchange1,
            Credentials.shared.wallet,
            opportunity.quote1.meta.routerAddress,
            opportunity.quote1.meta.factoryAddress
        );
        const exchange2 = getAdapter(
            opportunity.exchange2,
            Credentials.shared.wallet,
            opportunity.quote2.meta.routerAddress,
            opportunity.quote2.meta.factoryAddress
        );

        // Let's calculate the probability of the transaction succeeding
        const ttf1 = await exchange1.estimateTransactionTime(
            opportunity.quote1.tokenB,
            opportunity.quote1.tokenA
        );

        const ttf2 = await exchange2.estimateTransactionTime(
            opportunity.quote2.tokenA,
            opportunity.quote2.tokenB
        );

        const probability1 = calculateProfitProbability({
            type: exchange1.type,
            delta: opportunity.percentProfit,
            ttf: ttf1,
        });

        const probability2 = calculateProfitProbability({
            type: exchange2.type,
            delta: opportunity.percentProfit,
            ttf: ttf2,
        });

        // Let's calculate the size of the bid
        const balance1 =
            ((await liquidityCache.get(
                exchange1.type === "dex" ? "dex" : opportunity.exchange1,
                opportunity.quote1.tokenB.name
            )) ?? 0) * 0.97; // 3% for fee & slippage
        const balance2 =
            ((await liquidityCache.get(
                exchange2.type === "dex" ? "dex" : opportunity.exchange2,
                opportunity.quote2.tokenA.name
            )) ?? 0) * 0.97;

        const exchange1Data = {
            inputBalance: balance1,
            fee: exchange1.fee,
        };
        if (exchange1.type === "dex") {
            (exchange1Data as UniData).reserve0 = BigNumber.from(
                opportunity.quote1.meta.reserveA
            );
            (exchange1Data as UniData).reserve1 = BigNumber.from(
                opportunity.quote1.meta.reserveB
            );
        } else {
            (exchange1Data as CexData).price = opportunity.quote1.price;
            (exchange1Data as CexData).ask = opportunity.quote1.ask;
            (exchange1Data as CexData).bid = opportunity.quote1.bid;
        }

        const exchange2Data = {
            inputBalance: balance2,
            fee: exchange2.fee,
        };
        if (exchange2.type === "dex") {
            (exchange2Data as UniData).reserve0 = BigNumber.from(
                opportunity.quote2.meta.reserveA
            );
            (exchange2Data as UniData).reserve1 = BigNumber.from(
                opportunity.quote2.meta.reserveB
            );
        } else {
            (exchange2Data as CexData).price = opportunity.quote2.price;
            (exchange2Data as CexData).ask = opportunity.quote2.ask;
            (exchange2Data as CexData).bid = opportunity.quote2.bid;
        }

        const { amountInA, amountInB, amountOutA, amountOutB } = betSize({
            exchange1: exchange1Data as CexData | UniData,
            exchange2: exchange2Data as CexData | UniData,
        });

        if (
            amountInA <= 0 ||
            amountInB <= 0 ||
            amountOutA <= 0 ||
            amountOutB <= 0 ||
            amountOutB < amountInA
        ) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Bid amount is too low",
            };
        }

        // Then, let's calculate the cost of the transaction
        const cost1 = await exchange1.estimateTransactionCost(
            amountInA,
            opportunity.quote1.price,
            opportunity.quote1.tokenB,
            opportunity.quote1.tokenA,
            "buy"
        );

        const cost2 = await exchange2.estimateTransactionCost(
            amountInB,
            opportunity.quote2.price,
            opportunity.quote2.tokenA,
            opportunity.quote2.tokenB,
            "sell"
        );

        const profit = amountOutB - amountInA; // This is the profit in the quote token, but we don't care, the costInDollars is in the quote token

        // Verify that both costs is significantly less than the profit. If not, return undefined
        if (cost1.costInDollars + cost2.costInDollars > profit) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Cost is too high",
                cost1,
                cost2,
            };
        }

        if (Math.min(probability1, probability2) < 0.5) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Probability of success is too low",
                probability1,
                probability2,
            };
        }

        // Sometimes, concurrency issues can cause this to happen
        if (this.locked) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Locked",
            };
        }

        console.log(
            `Was about to buy ${amountOutA} ${opportunity.quote1.tokenA.name} on ${exchange1.name} for ${amountInA} ${opportunity.quote1.tokenB.name}`
        );
        console.log(
            `And sell ${amountInB} ${opportunity.quote2.tokenA.name} on ${exchange2.name} for ${amountOutB} ${opportunity.quote2.tokenB.name}`
        );

        ws.send(
            JSON.stringify({
                topic: "notify",
                action: "started_arbitrage",
                title: "Arbitrage Opportunity",
                message: `Buy ${amountOutA} ${opportunity.quote1.tokenA.name} on ${exchange1.name} for ${amountInA} ${opportunity.quote1.tokenB.name} and sell ${amountInB} ${opportunity.quote2.tokenA.name} on ${exchange2.name} for ${amountOutB} ${opportunity.quote2.tokenB.name}`,
            })
        );

        this.locked = true;
        this.softLocked = true;

        const peer1: PriceDataWorker =
            exchange1.type === "cex"
                ? offChainPeers.get(exchange1.name)!
                : onChainPeers.get(exchange1.name)!;
        const peer2: PriceDataWorker =
            exchange2.type === "cex"
                ? offChainPeers.get(exchange2.name)!
                : onChainPeers.get(exchange2.name)!;

        // Let's perform the transaction
        let receipt1: Receipt;
        let receipt2: Receipt;
        if (exchange1 instanceof UniswapV2 && exchange2 instanceof UniswapV2) {
            // Uniswap -> Uniswap we can use flash swaps
            const exchange2Data = {
                name: exchange2.name,
                factoryAddress: exchange2.source.address,
                routerAddress: exchange2.delegate.address,
            };
            const flashSwap = await peer1.coordinateFlashSwap(
                exchange2Data,
                amountOutA,
                [opportunity.quote1.tokenA, opportunity.quote1.tokenB]
            );

            receipt1 = {
                amountIn: flashSwap.amountIn, // Amount In A
                amountOut: amountOutA, // Amount Out A
                price: amountOutA / flashSwap.amountIn,
                tokenA: opportunity.quote1.tokenB,
                tokenB: opportunity.quote1.tokenA,
                transactionHash: flashSwap.transactionHash,
            };

            receipt2 = {
                amountIn: amountOutA, // Amount In B
                amountOut: flashSwap.amountOut, // Amount Out B
                price: flashSwap.price,
                tokenA: opportunity.quote2.tokenA,
                tokenB: opportunity.quote2.tokenB,
                transactionHash: flashSwap.transactionHash,
            };
        } else {
            const tx1 = await peer1.buyAtMinimumInput(
                amountOutA,
                [opportunity.quote1.tokenB, opportunity.quote1.tokenA],
                Credentials.shared.wallet.address,
                Date.now() + ttf1 * 1000
                // nonce + 1
            );

            const tx2 = await peer2.buyAtMaximumOutput(
                amountInB,
                [opportunity.quote2.tokenA, opportunity.quote2.tokenB],
                Credentials.shared.wallet.address,
                Date.now() + ttf2 * 1000
                // nonce + 2
            );

            // Let's wait for the transactions to complete
            // const [receipt1, receipt2] = await Promise.all([tx1, tx2]);
            receipt1 = tx1;
            receipt2 = tx2;
        }

        await liquidityCache.invalidate(
            exchange1.type === "dex" ? "dex" : opportunity.exchange1,
            opportunity.quote1.tokenA.name
        );
        await liquidityCache.invalidate(
            exchange1.type === "dex" ? "dex" : opportunity.exchange1,
            opportunity.quote1.tokenB.name
        );
        await liquidityCache.invalidate(
            exchange2.type === "dex" ? "dex" : opportunity.exchange2,
            opportunity.quote2.tokenA.name
        );
        await liquidityCache.invalidate(
            exchange2.type === "dex" ? "dex" : opportunity.exchange2,
            opportunity.quote2.tokenB.name
        );

        this.softLocked = false;
        this.locked = false;

        console.log(
            `Bought ${receipt1.amountOut} ${receipt1.tokenB.name} on ${exchange1.name} for ${receipt1.amountIn} ${receipt1.tokenA.name}`
        );
        console.log(
            `Sold ${receipt2.amountIn} ${receipt2.tokenA.name} on ${exchange2.name} for ${receipt2.amountOut} ${receipt2.tokenB.name}`
        );

        return {
            topic: "decision",
            opportunity,
            tx1: {
                ...receipt1,
                exchange: opportunity.exchange1,
            },
            tx2: {
                ...receipt2,
                exchange: opportunity.exchange2,
            },
        };
    }

    addPeer(topic: string, type: any, query: any): void {
        throw new Error("Method not implemented.");
    }
}
