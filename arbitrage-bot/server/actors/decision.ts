import { Actor, PartialResult } from "./actor";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "../data/adapters";
import { calculateProfitProbability } from "../../scripts/arbiter/profitChances";
import Credentials from "../credentials/Credentials";
import { Opportunity } from "../types/opportunity";
import { LiquidityCache } from "../data/priceData";
import { betSize } from "../../scripts/arbiter/betSize";
type DecisionOptions = {};
export default class Decision implements Actor<DecisionOptions> {
    // MARK: - Event handler
    async receive(fromLoop?: string | undefined): Promise<PartialResult> {
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
            delta: opportunity.profit,
            ttf: ttf1,
        });

        const probability2 = calculateProfitProbability({
            type: exchange2.type,
            delta: opportunity.profit,
            ttf: ttf2,
        });

        // Let's calculate the size of the bid
        const bidSize = betSize({
            profitProbability: Math.min(probability1, probability2),
            profitDelta: opportunity.percentProfit,
            maximumSlippage: 0.001,
        });

        const bidAmount1 = bidSize * opportunity.quote1.amount;
        const bidAmount2 = bidSize * opportunity.quote2.amount;

        // Then, let's calculate the cost of the transaction
        const cost1 = await exchange1.estimateTransactionCost(
            bidAmount1,
            opportunity.quote1.price,
            opportunity.quote1.tokenB,
            opportunity.quote1.tokenA,
            "buy"
        );

        const cost2 = await exchange2.estimateTransactionCost(
            bidAmount2,
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
            };
        }

        if (Math.min(probability1, probability2) < 0.5) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Probability of success is too low",
                probability: Math.min(probability1, probability2),
            };
        }

        // If we get here, we have a good opportunity
        // Let's perform the transaction
        const tx1 = await exchange1.swapExactTokensForTokens(
            bidAmount1,
            opportunity.quote1.amountOut,
            [opportunity.quote1.tokenB, opportunity.quote1.tokenA],
            Credentials.shared.wallet.address,
            Date.now() + ttf1 * 1000
        );

        const tx2 = await exchange2.swapExactTokensForTokens(
            bidAmount2,
            opportunity.quote2.amountOut,
            [opportunity.quote2.tokenA, opportunity.quote2.tokenB],
            Credentials.shared.wallet.address,
            Date.now() + ttf2 * 1000
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
            tx1,
            tx2,
        };
    }

    addPeer(peer: Actor<DecisionOptions>): void {
        throw new Error("Method not implemented.");
    }

    removePeer(peer: Actor<DecisionOptions>): void {
        throw new Error("Method not implemented.");
    }
}
