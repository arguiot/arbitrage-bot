import Credentials from "../credentials/Credentials";
import OnChain from "./onChain";
import OffChain from "./offChain";
import { MessagePort } from "worker_threads";
import { PartialResult } from "./actor";

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

type InOutMessage = {
    id: string;
    payload: PartialResult;
};

export default function Worker({ actorClass, parentPort, options, topic }: WorkerData) {
    const actor = new actors[actorClass](topic, {
        ...options,
        wallet: Credentials.shared.wallet,
    });

    parentPort.on("message", async (message: InOutMessage) => {
        const id = message.id;
        // const payload = message.payload;
        const result = await actor.receive();
        parentPort?.postMessage({
            id,
            payload: result,
        });
    });

    parentPort.on("error", (error) => {
        console.error(`Worker error: ${error}`);
    });
}
