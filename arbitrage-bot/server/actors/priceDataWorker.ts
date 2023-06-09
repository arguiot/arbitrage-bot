import { ServerWebSocket } from "../types/socket";
import { Actor, PartialResult } from "./actor";
import { Worker } from "worker_threads";
import crypto from "crypto";
import { SharedMemory } from "../store/SharedMemory";
import { Receipt, Token } from "../../src/exchanges/adapters/exchange";
import { UniswapV2Exchange } from "../../src/exchanges/UniswapV2";

type PriceDataWorkerOptions = {
    worker: Worker;
    ws?: ServerWebSocket;
};

type InOutMessage = {
    id: string;
    action: string;
    payload: PartialResult;
};

export default class PriceDataWorker implements Actor<PriceDataWorkerOptions> {
    worker: Worker;
    ws?: ServerWebSocket;

    memory: SharedMemory;

    callbacks: Map<string, (message: InOutMessage) => void> = new Map();

    constructor(memory: SharedMemory, { worker, ws }: PriceDataWorkerOptions) {
        this.ws = ws;
        this.memory = memory;
        this.worker = worker;
        this.worker.on("message", (message: InOutMessage) => {
            const id = message.id;
            const action = message.action;

            const callback = this.callbacks.get(`${action}-${id}`);
            if (callback) {
                callback(message);
                this.callbacks.delete(`${action}-${id}`);
            }
        });
    }

    // This function is called when actor receives a signal
    async receive(): Promise<PartialResult> {
        // ID is a unique identifier for this query
        const id = crypto.randomBytes(16).toString("hex");

        const timeStart = performance.now();

        this.callbacks.set(`receive-${id}`, (message: InOutMessage) => {
            const result = message.payload;

            const timeEnd = performance.now();
            const queryTime = timeEnd - timeStart;
            result.queryTime = queryTime;

            result.taskID = id;
            if (this.ws) {
                this.ws.publish(result.topic, JSON.stringify(result));
            } else {
                console.log("No WebSocket connection");
            }
        });

        this.worker.postMessage({
            id,
            action: "receive",
        });

        return { topic: "priceData" };
    }

    async buyAtMaximumOutput(
        amountIn: number,
        path: Token[],
        to: string,
        deadline: number,
        nonce?: number
    ): Promise<Receipt> {
        // ID is a unique identifier for this query
        const id = crypto.randomBytes(16).toString("hex");

        this.worker.postMessage({
            id,
            action: "buyAtMaximumOutput",
            payload: {
                amountIn,
                path,
                to,
                deadline,
                nonce,
            },
        });

        return new Promise((resolve, reject) => {
            this.callbacks.set(
                `buyAtMaximumOutput-${id}`,
                (message: InOutMessage) => {
                    const result = message.payload;
                    resolve(result.receipt);
                }
            );
        });
    }

    async buyAtMinimumInput(
        amountOut: number,
        path: Token[],
        to: string,
        deadline: number,
        nonce?: number
    ): Promise<Receipt> {
        // ID is a unique identifier for this query
        const id = crypto.randomBytes(16).toString("hex");

        this.worker.postMessage({
            id,
            action: "buyAtMinimumInput",
            payload: {
                amountOut,
                path,
                to,
                deadline,
                nonce,
            },
        });

        return new Promise((resolve, reject) => {
            this.callbacks.set(
                `buyAtMinimumInput-${id}`,
                (message: InOutMessage) => {
                    const result = message.payload;
                    resolve(result.receipt);
                }
            );
        });
    }

    async coordinateFlashSwap(
        exchange2: UniswapV2Exchange,
        amountBetween: number,
        path: Token[]
    ): Promise<Receipt> {
        // ID is a unique identifier for this query
        const id = crypto.randomBytes(16).toString("hex");

        this.worker.postMessage({
            id,
            action: "coordinateFlashSwap",
            payload: {
                exchange2,
                amountBetween,
                path,
            },
        });

        return new Promise((resolve, reject) => {
            this.callbacks.set(
                `coordinateFlashSwap-${id}`,
                (message: InOutMessage) => {
                    const result = message.payload;
                    resolve(result.receipt);
                }
            );
        });
    }

    addPeer(topic: string, type: any, query: any): void {
        throw new Error("Method not implemented.");
    }
}
