import { ethers } from "ethers";
import { Runnable } from "../tasks/runnable";
import { ServerWebSocket } from "../types/socket";
import { Actor, PartialResult } from "./actor";

export type OnChainOptions = {
    ws: ServerWebSocket;
    provider: ethers.providers.JsonRpcProvider;
};

export default class OnChain implements Actor<OnChainOptions> {
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
            console.error(e);
            return { topic: this.topic, error: e };
        }
    }

    addPeer(peer: Actor<OnChainOptions>): void {
        throw new Error("Method not implemented.");
    }

    removePeer(peer: Actor<OnChainOptions>): void {
        throw new Error("Method not implemented.");
    }
}
