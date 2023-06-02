import { Actor, PartialResult } from "./actor";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "../data/adapters";
import { calculateProfitProbability } from "../../scripts/arbiter/profitChances";
import Credentials from "../credentials/Credentials";
import { Opportunity } from "../types/opportunity";
import { LiquidityCache } from "../data/priceData";
import { betSize } from "../../scripts/arbiter/betSize";
import { ServerWebSocket } from "../types/socket";
type DecisionOptions = {
    ws: ServerWebSocket;
};
export default class Decision implements Actor<DecisionOptions> {
    locked = false;

    // MARK: - Event handler
    async receive({ ws }: DecisionOptions): Promise<PartialResult> {
        if (this.locked) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Locked",
            };
        }

        // First, let's get the opportunities
        const opportunity =
            PriceDataStore.shared.getArbitrageOpportunity() as Opportunity;
        if (!opportunity) {
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
                (LiquidityCache.shared.get(
                    opportunity.exchange1,
                    opportunity.quote1.tokenB.name
                ) ?? 0),
            bidSize *
                (LiquidityCache.shared.get(
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

        // If we get here, we have a good opportunity
        // Let's perform the transaction
        const tx1 = await exchange1.buyAtMinimumInput(
            bidAmount,
            [opportunity.quote1.tokenB, opportunity.quote1.tokenA],
            Credentials.shared.wallet.address,
            Date.now() + ttf1 * 1000
        );

        console.log(`Transaction on ${exchange1.name} is successful`);
        console.log(
            `Bought ${tx1.amountOut} ${tx1.tokenB.name} for ${tx1.amountIn} ${tx1.tokenA.name}`
        );

        ws.send(
            JSON.stringify({
                topic: "notify",
                title: `Transaction on ${exchange1.name} is successful`,
                message: `Bought ${tx1.amountOut} ${tx1.tokenB.name} for ${tx1.amountIn} ${tx1.tokenA.name}`,
            })
        );

        const tx2 = await exchange2.buyAtMaximumOutput(
            bidAmount,
            [opportunity.quote2.tokenA, opportunity.quote2.tokenB],
            Credentials.shared.wallet.address,
            Date.now() + ttf2 * 1000
        );

        console.log(`Transaction on ${exchange2.name} is successful`);
        console.log(
            `Sold ${tx2.amountIn} ${tx2.tokenA.name} for ${tx2.amountOut} ${tx2.tokenB.name}`
        );

        ws.send(
            JSON.stringify({
                topic: "notify",
                title: `Transaction on ${exchange2.name} is successful`,
                message: `Sold ${tx2.amountIn} ${tx2.tokenA.name} for ${tx2.amountOut} ${tx2.tokenB.name} `,
            })
        );

        LiquidityCache.shared.invalidate(
            opportunity.exchange1,
            opportunity.quote1.tokenA.name
        );
        LiquidityCache.shared.invalidate(
            opportunity.exchange1,
            opportunity.quote1.tokenB.name
        );
        LiquidityCache.shared.invalidate(
            opportunity.exchange2,
            opportunity.quote2.tokenA.name
        );
        LiquidityCache.shared.invalidate(
            opportunity.exchange2,
            opportunity.quote2.tokenB.name
        );

        return {
            topic: "decision",
            opportunity,
            tx1: {
                ...tx1,
                exchange: opportunity.exchange1,
            },
            tx2: {
                ...tx2,
                exchange: opportunity.exchange2,
            },
        };
    }

    addPeer(peer: Actor<DecisionOptions>): void {
        throw new Error("Method not implemented.");
    }

    removePeer(peer: Actor<DecisionOptions>): void {
        throw new Error("Method not implemented.");
    }
}
