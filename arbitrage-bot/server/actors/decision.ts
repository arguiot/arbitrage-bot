import { Actor, PartialResult } from "./actor";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "../data/adapters";

type DecisionOptions = {

};
export default class Decision implements Actor<DecisionOptions> {
    async receive(fromLoop?: string | undefined): Promise<PartialResult> {
        // First, let's get the opportunities
        const opportunity = PriceDataStore.shared.getArbitrageOpportunity();
        if (!opportunity) {
            return {
                topic: "decision",
                opportunity: undefined,
            };
        }
        // Then, let's calculate the cost of the transaction
        const exchange1 = getAdapter(opportunity.exchange1, undefined);
        const exchange2 = getAdapter(opportunity.exchange2, undefined);

        const cost1 = await exchange1.estimateTransactionCost(
            opportunity.quote1.amountIn,
            opportunity.tokenA,
            opportunity.tokenB,
            "buy"
        );

        const cost2 = await exchange2.estimateTransactionCost(
            opportunity.quote2.amount,
            opportunity.tokenB,
            opportunity.tokenA,
            "sell"
        );

        // console.log({ cost1, cost2 });

        return {
            topic: "decision",
            opportunity,
        };
    }

    addPeer(peer: Actor<DecisionOptions>): void {
        throw new Error("Method not implemented.");
    }

    removePeer(peer: Actor<DecisionOptions>): void {
        throw new Error("Method not implemented.");
    }
}
