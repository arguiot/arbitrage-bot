import { ethers } from "ethers";
import { ServerWebSocket } from "../types/socket";
import OnChain from "./onChain";
import OffChain from "./offChain";
import { Runnable } from "../tasks/runnable";
import priceData from "../data/priceData";
import { Actor, PartialResult } from "./actor";
import { Query } from "../types/request";
import Decision from "./decision";
import Credentials from "../credentials/Credentials";
type MainActorOptions = {
    ws: ServerWebSocket;
};

export default class MainActor implements Actor<MainActorOptions> {
    ws?: ServerWebSocket = undefined;

    provider = Credentials.shared.wallet.provider;


    constructor() {
        (async () => {
            console.log("Connected to provider: " + process.env.JSON_RPC_URL);
            console.log("Block number: " + await this.provider.getBlockNumber())
        })();
    }


    // MARK: - Actor
    start(options: MainActorOptions): void {
        this.ws = options.ws;

        // On chain peers
        // Clear provider events
        this.provider.removeAllListeners("block");
        this.provider.on("block", async (blockNumber) => {
            console.log("New block: " + blockNumber);
            await this.receive();
            this.onChainPeers.forEach(async (peer) => {
                const timeStart = performance.now();
                const result = await peer.receive();
                const timeEnd = performance.now();
                const queryTime = timeEnd - timeStart;
                result.queryTime = queryTime;
                if (this.ws) {
                    this.ws.publish(result.topic, JSON.stringify(result));
                } else {
                    console.log("No WebSocket connection");
                }
            });
        });

        // Main loop
        const interval = setInterval(async () => {
            await this.mainLoop();
        }, 1000);
    }

    async mainLoop() {
        await this.receive();
        for (const peer of this.offChainPeers) {
            const timeStart = performance.now();
            const result = await peer.receive();
            const timeEnd = performance.now();
            const queryTime = timeEnd - timeStart;
            result.queryTime = queryTime;
            if (this.ws) {
                this.ws.publish(result.topic, JSON.stringify(result));
            }
        }
    }

    async receive(): Promise<PartialResult> {
        const result = await this.decisionPeer.receive();
        if (this.ws) {
            this.ws.publish(result.topic, JSON.stringify(result));
        }
        return {
            topic: "mainActor",
        };
    }

    decisionPeer = new Decision();

    onChainPeers: OnChain[] = [];
    offChainPeers: OffChain[] = [];

    addPeer(peer: Actor<MainActorOptions>): void {
        if (peer instanceof OnChain) {
            this.onChainPeers.push(peer);
        }
        if (peer instanceof OffChain) {
            this.offChainPeers.push(peer);
        }
    }

    removePeer(peer: Actor<MainActorOptions>): void {
        if (peer instanceof OnChain) {
            const index = this.onChainPeers.indexOf(peer);
            if (index >= 0) {
                this.onChainPeers.splice(index, 1);
            }
        }
        if (peer instanceof OffChain) {
            const index = this.offChainPeers.indexOf(peer);
            if (index >= 0) {
                this.offChainPeers.splice(index, 1);
            }
        }
    }

    addOnChainTask(topic: string, task: Runnable) {
        const onChain = new OnChain(topic, task);
        if (this.ws) {
            this.addPeer(onChain);
        }
    }

    addOffChainTask(topic: string, task: Runnable) {
        const offChain = new OffChain(topic, task);
        if (this.ws) {
            this.addPeer(offChain);
        }
    }

    // MARK: - Tasks
    subscribeToPriceData(query: Query) {
        if (query.type == "dex") {
            this.addOnChainTask("priceData", async () => {
                return await priceData({ ...query, provider: this.provider });
            });
        } else {
            this.addOffChainTask("priceData", async () => {
                return await priceData({ ...query, provider: this.provider });
            });
        }
    }
}
