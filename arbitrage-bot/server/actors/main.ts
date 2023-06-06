import { ServerWebSocket } from "../types/socket";
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

    interval: NodeJS.Timeout | undefined = undefined;

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
    async start(options: MainActorOptions): Promise<void> {
        await this.clearTasks(); // Clear tasks and reset the memory
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
        if (this.interval) {
            clearInterval(this.interval);
        }

        this.interval = setInterval(async () => {
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

    async clearTasks() {
        for (const [_exchange, peer] of this.onChainPeers) {
            await peer.worker.terminate();
        }
        for (const [_exchange, peer] of this.offChainPeers) {
            await peer.worker.terminate();
        }
        this.onChainPeers.clear();
        this.offChainPeers.clear();

        // Clear memory
        this.memory.clear();
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

type ActorOptions = {
    ws: () => ServerWebSocket | undefined;
    workerPath: string;
    options: PriceQuery;
    topic: string;
    memory: SharedMemory;
};

export function spawnActor({
    ws,
    workerPath,
    options,
    topic,
    memory,
}: ActorOptions) {
    const worker = new Worker(path.join(__dirname, "worker.js"), {
        workerData: {
            memory,
            path: workerPath,
            passedOptions: {
                options,
                topic,
            },
        },
        // @ts-expect-error
        name: options.exchange,
    });

    worker.on("message", (result: PartialResult) => {
        if (typeof result !== "object") return;
        const webSocket = ws();
        if (webSocket) {
            webSocket.publish(result.topic, JSON.stringify(result));
        }
    });

    worker.on("error", (error) => {
        console.error(error);
    });

    worker.on("exit", (code) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
        }
    });

    return worker;
}
