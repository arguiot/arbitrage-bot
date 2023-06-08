import { ethers } from "ethers";
import { ServerWebSocket } from "../types/socket";
import { Actor, PartialResult } from "./actor";
import priceData from "../data/priceData";
import { SharedMemory } from "../store/SharedMemory";
import { PriceDataQuery } from "../types/priceDataQuery";
import { Receipt, Token } from "../../src/exchanges/adapters/exchange";
import { getAdapter } from "../data/adapters";
import { UniswapV2, UniswapV2Exchange } from "../../src/exchanges/UniswapV2";

export type ExchangeOptions = {
    ws: ServerWebSocket;
    provider: ethers.providers.JsonRpcProvider;
};

type ExchangeQuery = {
    query: PriceDataQuery;
    wallet: ethers.Wallet;
};

export default class ExchangeController implements Actor<ExchangeOptions> {
    query: PriceDataQuery;
    topic: string;
    memory: SharedMemory;
    wallet: ethers.Wallet;

    constructor(topic: string, memory: SharedMemory, query: ExchangeQuery) {
        this.topic = topic;
        this.memory = memory;
        this.query = query.query;
        this.wallet = query.wallet;
    }

    // This function is called when actor receives a signal
    async receive(): Promise<PartialResult> {
        try {
            const priceQuery = {
                ...this.query,
                wallet: this.wallet,
            };
            const quote = await priceData(this.memory, priceQuery);
            const result = {
                topic: this.topic,
                ...quote,
            };
            return result;
        } catch (e) {
            console.error(e);
            return { topic: this.topic, error: e };
        }
    }

    async buyAtMaximumOutput(
        amountIn: number,
        path: Token[],
        to: string,
        deadline: number,
        nonce?: number
    ): Promise<Receipt> {
        const exchange = getAdapter(
            this.query.exchange,
            this.wallet,
            this.query.routerAddress,
            this.query.factoryAddress
        );

        return await exchange.buyAtMaximumOutput(
            amountIn,
            path,
            to,
            deadline,
            nonce
        );
    }

    async buyAtMinimumInput(
        amountOut: number,
        path: Token[],
        to: string,
        deadline: number,
        nonce?: number
    ): Promise<Receipt> {
        const exchange = getAdapter(
            this.query.exchange,
            this.wallet,
            this.query.routerAddress,
            this.query.factoryAddress
        );

        return await exchange.buyAtMinimumInput(
            amountOut,
            path,
            to,
            deadline,
            nonce
        );
    }

    async coordinateFlashSwap(
        _exchange2: UniswapV2Exchange,
        amountBetween: number,
        path: Token[]
    ): Promise<Receipt> {
        const exchange = getAdapter(
            this.query.exchange,
            this.wallet,
            this.query.routerAddress,
            this.query.factoryAddress
        );

        const exchange2 = getAdapter(
            _exchange2.name,
            this.wallet,
            _exchange2.routerAddress,
            _exchange2.factoryAddress
        );

        if (
            !(exchange instanceof UniswapV2) ||
            !(exchange2 instanceof UniswapV2)
        ) {
            throw new Error("Not a UniswapV2 exchange");
        }

        return await exchange.coordinateFlashSwap(
            exchange2,
            amountBetween,
            path
        );
    }

    addPeer(topic: string, type: any, query: any): void {
        throw new Error("Method not implemented.");
    }
}
