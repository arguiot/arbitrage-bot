import { ethers } from "ethers";
import { ServerWebSocket } from "../types/socket";
import OnChain from "./onChain";
import OffChain from "./offChain";
import { Runnable } from "../tasks/runnable";
import priceData from "../data/priceData";
import { Actor, PartialResult } from "./actor";
import { Query, Token } from "../types/request";
import Decision from "./decision";
import Credentials from "../credentials/Credentials";
import { Worker } from "worker_threads";
import path from "path";
import PriceDataWorker from "./priceDataWorker";
import { SharedMemory } from "../store/SharedMemory";

type MainActorOptions = {
    ws: ServerWebSocket;
};

type ActorType = "on-chain" | "off-chain";
type PriceQuery = {
    exchange: string;
    tokenA: Token;
    tokenB: Token;
    routerAddress?: string;
    factoryAddress?: string;
};
export default class MainActor implements Actor<MainActorOptions> {
    ws?: ServerWebSocket = undefined;

    wallet = Credentials.shared.wallet;

    memory = new SharedMemory();

    broadcastDecisions = false;

    constructor() {
        (async () => {
            console.log("Connected to provider: " + process.env.JSON_RPC_URL);
            console.log(
                "Block number: " + (await this.wallet.provider.getBlockNumber())
            );
        })();
        this.decisionPeer = new Decision(this.memory);
    }

    // MARK: - Actor
    start(options: MainActorOptions): void {
        this.ws = options.ws;

        // On chain peers
        // Clear provider events
        this.wallet.provider.removeAllListeners("block");
        this.wallet.provider.on("block", async (blockNumber) => {
            console.log("New block: " + blockNumber);
            await this.receive();
            this.onChainPeers.forEach(async (peer) => {
                peer.ws = this.ws;
                peer.memory = this.memory;
                await peer.receive();
            });
        });

        // Main loop
        const interval = setInterval(async () => {
            await this.mainLoop();
        }, 1000);
    }

    async mainLoop() {
        await this.receive();
        for (const [_exchange, peer] of this.offChainPeers) {
            peer.ws = this.ws;
            peer.memory = this.memory;
            await peer.receive();
        }
    }

    async receive(): Promise<PartialResult> {
        if (this.broadcastDecisions && this.ws) {
            const result = await this.decisionPeer.receive({
                ws: this.ws,
                onChainPeers: this.onChainPeers,
                offChainPeers: this.offChainPeers,
            });
            if (result.reason) {
                console.log(result.reason);
            }
            if (result.opportunity) {
                this.ws.publish(result.topic, JSON.stringify(result));
            }
        }
        return {
            topic: "mainActor",
        };
    }

    decisionPeer: Decision;

    onChainPeers: Map<string, PriceDataWorker> = new Map();
    offChainPeers: Map<string, PriceDataWorker> = new Map();

    addPeer(topic: string, type: ActorType, query: PriceQuery): void {
        const worker = spawnActor({
            ws: () => this.ws,
            actor: type,
            options: query,
            topic: topic,
            workerPath: path.join(__dirname, "spawnActor.ts"),
            memory: this.memory,
        });

        const peer = new PriceDataWorker(this.memory, { worker });

        if (type === "on-chain") {
            this.onChainPeers.set(query.exchange, peer);
        }
        if (type === "off-chain") {
            this.offChainPeers.set(query.exchange, peer);
        }
    }

    addOnChainTask(topic: string, task: PriceQuery) {
        if (this.ws) {
            this.addPeer(topic, "on-chain", task);
        }
    }

    addOffChainTask(topic: string, task: PriceQuery) {
        if (this.ws) {
            this.addPeer(topic, "off-chain", task);
        }
    }

    // MARK: - Tasks
    subscribeToPriceData(query: Query) {
        if (typeof query === "undefined") return;
        if (query.type === "dex") {
            this.addOnChainTask("priceData", query);
        } else {
            this.addOffChainTask("priceData", query);
        }
    }
}

type ActorOptions<T> = {
    ws: () => ServerWebSocket | undefined;
    actor: ActorType;
    workerPath: string;
    options: T;
    topic: string;
    memory: SharedMemory;
};

export function spawnActor<T>({
    ws,
    actor,
    workerPath,
    options,
    topic,
    memory,
}: ActorOptions<T>) {
    const worker = new Worker(path.join(__dirname, "worker.js"), {
        workerData: {
            memory,
            path: workerPath,
            passedOptions: {
                options,
                topic,
                actorClass: actor,
            },
        },
    });

    worker.on("message", (result: PartialResult) => {
        if (typeof result !== "object") return;
        const webSocket = ws();
        if (webSocket) {
            webSocket.publish(result.topic, JSON.stringify(result));
        }
    });

    worker.on("error", (error) => {
        debugger;
        console.error(error);
    });

    worker.on("exit", (code) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
        }
    });

    return worker;
}
