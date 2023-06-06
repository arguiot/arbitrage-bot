import { Actor, PartialResult } from "./actor";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "../data/adapters";
import { calculateProfitProbability } from "../../scripts/arbiter/profitChances";
import Credentials from "../credentials/Credentials";
import { Opportunity } from "../types/opportunity";
import { LiquidityCache } from "../store/LiquidityCache";
import { betSize } from "../../scripts/arbiter/betSize";
import { ServerWebSocket } from "../types/socket";
import { SharedMemory } from "../store/SharedMemory";
import PriceDataWorker from "./priceDataWorker";

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
    async receive({ ws, onChainPeers, offChainPeers }: DecisionOptions): Promise<PartialResult> {
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
            priceDataStore.getArbitrageOpportunity() as Opportunity;

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
            opportunity.quote1.routerAddress,
            opportunity.quote1.factoryAddress
        );
        const exchange2 = getAdapter(
            opportunity.exchange2,
            Credentials.shared.wallet,
            opportunity.quote2.routerAddress,
            opportunity.quote2.factoryAddress
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
        const bidSize = betSize({
            profitProbability: Math.min(probability1, probability2),
            profitDelta: opportunity.percentProfit,
            maximumSlippage: 0.001,
        });

        const bidAmount = [
            opportunity.quote1.amount,
            opportunity.quote2.amount,
            bidSize *
            (await liquidityCache.get(
                opportunity.exchange1,
                opportunity.quote1.tokenB.name
            ) ?? 0),
            bidSize *
            (await liquidityCache.get(
                opportunity.exchange2,
                opportunity.quote2.tokenA.name
            ) ?? 0),
        ]
            .filter((x) => x > 0)
            .reduce((a, b) => Math.min(a, b));

        // Then, let's calculate the cost of the transaction
        const cost1 = await exchange1.estimateTransactionCost(
            bidAmount,
            opportunity.quote1.price,
            opportunity.quote1.tokenB,
            opportunity.quote1.tokenA,
            "buy"
        );

        const cost2 = await exchange2.estimateTransactionCost(
            bidAmount,
            opportunity.quote2.price,
            opportunity.quote2.tokenA,
            opportunity.quote2.tokenB,
            "sell"
        );

        // Verify that both costs is significantly less than the profit. If not, return undefined
        if (cost1.costInDollars + cost2.costInDollars > opportunity.profit) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Cost is too high",
                cost1,
                cost2,
            };
        }

        // if (Math.min(probability1, probability2) < 0.5) {
        //     return {
        //         topic: "decision",
        //         opportunity: undefined,
        //         reason: "Probability of success is too low",
        //         probability1,
        //         probability2,
        //     };
        // }

        // Sometimes, concurrency issues can cause this to happen
        if (this.locked) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Locked",
            };
        }

        console.log(
            `Was about to buy ${bidAmount} ${opportunity.quote1.tokenA.name} on ${exchange1.name} for ${opportunity.quote1.amountOut} ${opportunity.quote1.tokenB.name}`
        );
        console.log(
            `And sell ${bidAmount} ${opportunity.quote2.tokenB.name} on ${exchange2.name} for ${opportunity.quote2.amountOut} ${opportunity.quote2.tokenA.name}`
        );

        ws.send(
            JSON.stringify({
                topic: "notify",
                title: "Arbitrage Opportunity",
                message: `Buy ${bidAmount} ${opportunity.quote1.tokenA.name} on ${exchange1.name} for ${opportunity.quote1.amountOut} ${opportunity.quote1.tokenB.name} and sell ${bidAmount} ${opportunity.quote2.tokenB.name} on ${exchange2.name} for ${opportunity.quote2.amountOut} ${opportunity.quote2.tokenA.name}`,
            })
        );

        this.locked = true;
        this.softLocked = true;

        const peer1: PriceDataWorker = exchange1.type === "cex" ? offChainPeers.get(exchange1.name)! : onChainPeers.get(exchange1.name)!;
        const peer2: PriceDataWorker = exchange2.type === "cex" ? offChainPeers.get(exchange2.name)! : onChainPeers.get(exchange2.name)!;
        // If we get here, we have a good opportunity
        const nonce = await Credentials.shared.wallet.getTransactionCount();
        // Let's perform the transaction
        const tx1 = await peer1.buyAtMinimumInput(
            bidAmount,
            [opportunity.quote1.tokenB, opportunity.quote1.tokenA],
            Credentials.shared.wallet.address,
            Date.now() + ttf1 * 1000,
            // nonce + 1
        );

        const tx2 = await peer2.buyAtMaximumOutput(
            bidAmount,
            [opportunity.quote2.tokenA, opportunity.quote2.tokenB],
            Credentials.shared.wallet.address,
            Date.now() + ttf2 * 1000,
            // nonce + 2
        );

        // Let's wait for the transactions to complete
        // const [receipt1, receipt2] = await Promise.all([tx1, tx2]);
        const receipt1 = tx1;
        const receipt2 = tx2;

        await liquidityCache.invalidate(
            opportunity.exchange1,
            opportunity.quote1.tokenA.name
        );
        await liquidityCache.invalidate(
            opportunity.exchange1,
            opportunity.quote1.tokenB.name
        );
        await liquidityCache.invalidate(
            opportunity.exchange2,
            opportunity.quote2.tokenA.name
        );
        await liquidityCache.invalidate(
            opportunity.exchange2,
            opportunity.quote2.tokenB.name
        );

        this.softLocked = false;

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
