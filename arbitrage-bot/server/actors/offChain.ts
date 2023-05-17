import { ethers } from "ethers";
import { Runnable } from "../tasks/runnable";
import { ServerWebSocket } from "../types/socket";
import { Actor, PartialResult } from "./actor";

export type OffChainOptions = {
    ws: ServerWebSocket;
    provider: ethers.providers.JsonRpcProvider;
};

export default class OffChain implements Actor<OffChainOptions> {
    task: Runnable;
    topic: string;
    constructor(topic: string, task: Runnable) {
        this.topic = topic;
        this.task = task;
    }

    // This function is called when actor receives a signal
    async receive(): Promise<PartialResult> {
        try {
            const result = await this.task();
            result.topic = this.topic;
            return result;
        } catch (e) {
            return { topic: this.topic, error: e };
        }
    }

    addPeer(peer: Actor<OffChainOptions>): void {
        throw new Error("Method not implemented.");
    }

    removePeer(peer: Actor<OffChainOptions>): void {
        throw new Error("Method not implemented.");
    }
}
