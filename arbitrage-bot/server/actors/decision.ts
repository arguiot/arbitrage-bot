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

        debugger;

        if (!opportunity) {
            console.log("No opportunity");
            return {
                topic: "decision",
                opportunity: undefined,
            };
        }

        const exchanges = opportunity.exchanges.map((exchange, index) =>
            getAdapter(
                exchange,
                Credentials.shared.wallet,
                opportunity.quotes[index].meta.routerAddress,
                opportunity.quotes[index].meta.factoryAddress
            )
        );

        // Let's calculate the probability of the transaction succeeding
        const ttfs = await Promise.all(
            exchanges.map((exchange, index) =>
                exchange.estimateTransactionTime(
                    opportunity.quotes[index].tokenA,
                    opportunity.quotes[index].tokenB
                )
            )
        );

        const probabilities = exchanges.map((exchange, index) =>
            calculateProfitProbability({
                type: exchange.type,
                delta: opportunity.percentProfit,
                ttf: ttfs[index],
            })
        );

        // Let's calculate the size of the bid
        const balances = await Promise.all(
            exchanges.map(
                async (exchange, index) =>
                    ((await liquidityCache.get(
                        exchange.type === "dex"
                            ? "dex"
                            : opportunity.exchanges[index],
                        opportunity.quotes[index].tokenA.name
                    )) ?? 0) * 0.97
            )
        );

        const exchangesData = exchanges.map((exchange, index) => {
            const data = {
                inputBalance: balances[index],
                fee: exchange.fee,
            };
            if (exchange.type === "dex") {
                (data as UniData).reserve0 = BigNumber.from(
                    opportunity.quotes[index].meta.reserveA
                );
                (data as UniData).reserve1 = BigNumber.from(
                    opportunity.quotes[index].meta.reserveB
                );
            } else {
                (data as CexData).price = opportunity.quotes[index].price;
                (data as CexData).ask = opportunity.quotes[index].ask;
                (data as CexData).bid = opportunity.quotes[index].bid;
            }
            return data;
        });

        const exchangeQuotes = betSize(exchangesData as (CexData | UniData)[]);

        if (
            exchangeQuotes.some(
                (quote, index) =>
                    quote.amountIn > balances[index] || quote.amountIn < 0.01
            )
        ) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Bid amount is too low",
            };
        }

        // Then, let's calculate the cost of the transaction
        const cost = (
            await Promise.all(
                exchanges.map(
                    async (exchange, index) =>
                        await exchange.estimateTransactionCost(
                            exchangeQuotes[index].amountIn,
                            opportunity.quotes[index].price,
                            opportunity.quotes[index].tokenA,
                            opportunity.quotes[index].tokenB,
                            index % 2 === 0 ? "buy" : "sell"
                        )
                )
            )
        ).reduce((prev, curr) => prev + curr.costInDollars, 0);

        const profit = opportunity.profit;

        // Verify that both costs is significantly less than the profit. If not, return undefined
        if (cost > profit) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Cost is too high",
                cost,
            };
        }

        if (probabilities.reduce((prev, curr) => Math.min(prev, curr)) < 0.5) {
            return {
                topic: "decision",
                opportunity: undefined,
                reason: "Probability of success is too low",
                probabilities,
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

        // Print the routes
        console.log(`${opportunity.quotes.map((quote) => `(${quote.exchange}) ${quote.amount} ${quote.tokenA.name} -> ${quote.amountOut} ${quote.tokenB.name}`).join(" -> ")}`);
        ws.send(
            JSON.stringify({
                topic: "notify",
                action: "started_arbitrage",
                title: "Arbitrage Opportunity",
                message: `${opportunity.quotes.map((quote) => `(${quote.exchange}) ${quote.amount} ${quote.tokenA.name} -> ${quote.amountOut} ${quote.tokenB.name}`).join(" -> ")}`,
            })
        );

        this.locked = true;
        this.softLocked = true;

        const peers: PriceDataWorker[] = exchanges.map((exchange) =>
            exchange.type === "cex"
                ? offChainPeers.get(exchange.name)!
                : onChainPeers.get(exchange.name)!
        );

        // Let's perform the transaction
        const receipts: Receipt[] = [];
        if (exchanges.every((item) => item instanceof UniswapV2)) {
            // Uniswap -> Uniswap -> ... we can use flash swaps
            const exchange2Data = {
                name: exchange2.name,
                factoryAddress: exchange2.source.address,
                routerAddress: exchange2.delegate.address,
            };
            const flashSwap = await peers[0].coordinateFlashSwap(
                exchange2Data,
                amountOutA,
                [opportunity.quote1.tokenA, opportunity.quote1.tokenB]
            );

            receipt1 = {
                amountIn: flashSwap.amountIn, // Amount In A
                amountOut: amountOutA, // Amount Out A
                price: flashSwap.amountIn / amountOutA,
                tokenA: opportunity.quote1.tokenB,
                tokenB: opportunity.quote1.tokenA,
                transactionHash: flashSwap.transactionHash,
            };

            receipt2 = {
                amountIn: amountOutA, // Amount In B
                amountOut: flashSwap.amountOut, // Amount Out B
                price: flashSwap.amountOut / amountOutA,
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
