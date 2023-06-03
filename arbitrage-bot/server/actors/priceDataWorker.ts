import { ethers } from "ethers";
import { Runnable } from "../tasks/runnable";
import { ServerWebSocket } from "../types/socket";
import { Actor, PartialResult } from "./actor";
import priceData from "../data/priceData";
import Credentials from "../credentials/Credentials";
import OnChain from "./onChain";
import OffChain from "./offChain";
import { MessagePort } from "worker_threads";
import { spawnActor } from "./main";
import { Worker } from "worker_threads";
import crypto from "crypto";

const actors = {
    "on-chain": OnChain,
    "off-chain": OffChain,
};

type PriceDataWorkerOptions = {
    worker: Worker;
    ws?: ServerWebSocket;
};

type InOutMessage = {
    id: string;
    payload: PartialResult;
};

export default class PriceDataWorker implements Actor<PriceDataWorkerOptions> {
    worker: Worker;
    ws?: ServerWebSocket;

    timers: Map<string, number> = new Map();

    constructor({ worker, ws }: PriceDataWorkerOptions) {
        this.ws = ws;
        this.worker = worker;
        this.worker.on("message", (message: InOutMessage) => {
            const id = message.id;
            const result = message.payload;

            const timeStart = this.timers.get(id);
            if (timeStart) {
                const timeEnd = performance.now();
                const queryTime = timeEnd - timeStart;
                result.queryTime = queryTime;
            }
            result.taskID = id;
            if (this.ws) {
                this.ws.publish(result.topic, JSON.stringify(result));
            } else {
                console.log("No WebSocket connection");
            }
        });
    }

    // This function is called when actor receives a signal
    async receive(): Promise<PartialResult> {
        // ID is a unique identifier for this query
        const id = crypto.randomBytes(16).toString("hex");

        const timeStart = performance.now();
        this.timers.set(id, timeStart);
        this.worker.postMessage({
            id,
        });

        return { topic: "priceData" };
    }

    addPeer(topic: string, type: any, query: any): void {
        throw new Error("Method not implemented.");
    }
}
