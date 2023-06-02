import Credentials from "../credentials/Credentials";
import OnChain from "./onChain";
import OffChain from "./offChain";
import { MessagePort } from "worker_threads";

const actors = {
    "on-chain": OnChain,
    "off-chain": OffChain,
};

type WorkerData = {
    actorClass: keyof typeof actors;
    parentPort: MessagePort;
    options: any;
    topic: string;
};

export default function Worker({ actorClass, parentPort, options, topic }: WorkerData) {
    const actor = new actors[actorClass](topic, {
        ...options,
        wallet: Credentials.shared.wallet,
    });

    parentPort.on("message", async (message) => {
        console.log("Worker received message: " + message);
        const result = await actor.receive();
        parentPort?.postMessage(result);
    });

    parentPort.on("error", (error) => {
        console.error(`Worker error: ${error}`);
    });
}
