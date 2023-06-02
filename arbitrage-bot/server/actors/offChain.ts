import { ethers } from "ethers";
import { Runnable } from "../tasks/runnable";
import { ServerWebSocket } from "../types/socket";
import { Actor, PartialResult } from "./actor";
import priceData from "../data/priceData";

export type OffChainOptions = {
    ws: ServerWebSocket;
    provider: ethers.providers.JsonRpcProvider;
};

export default class OffChain implements Actor<OffChainOptions> {
    task: Runnable;
    topic: string;

    constructor(topic: string, query: any) {
        this.topic = topic;
        this.task = async () => {
            return await priceData(query);
        };
    }

    // This function is called when actor receives a signal
    async receive(): Promise<PartialResult> {
        try {
            const result = await this.task();
            result.topic = this.topic;
            return result;
        } catch (e) {
            console.error(e);
            return { topic: this.topic, error: e };
        }
    }

    addPeer(topic: string, type: any, query: any): void {
        throw new Error("Method not implemented.");
    }
}
