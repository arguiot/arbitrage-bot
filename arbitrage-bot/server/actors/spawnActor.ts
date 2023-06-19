import Credentials from "../credentials/Credentials";
import { MessagePort } from "worker_threads";
import { PartialResult } from "./actor";
import { SharedMemory } from "../store/SharedMemory";
import ExchangeController from "./ExchangeController";

type WorkerData = {
    parentPort: MessagePort;
    options: any;
    topic: string;
    memory: SharedMemory;
};

type InOutMessage = {
    id: string;
    action: string;
    payload: PartialResult;
};

export default function Worker({
    parentPort,
    options,
    topic,
    memory,
}: WorkerData) {
    const sharedMemory = new SharedMemory(memory.store);
    const actor = new ExchangeController(topic, sharedMemory, {
        query: options,
        wallet: Credentials.shared.wallet,
    });

    parentPort.on("message", async (message: InOutMessage) => {
        const id = message.id;
        const action = message.action;
        const payload = message.payload;
        switch (action) {
            case "receive":
                parentPort?.postMessage({
                    id,
                    action,
                    payload: await actor.receive(),
                });
                break;
            case "buyAtMinimumInput":
                console.log(payload);
                parentPort?.postMessage({
                    id,
                    action,
                    payload: {
                        receipt: await actor.buyAtMinimumInput(
                            payload.amountOut,
                            payload.path,
                            payload.to,
                            payload.deadline,
                            payload.nonce
                        ),
                    },
                });
                break;
            case "buyAtMaximumOutput":
                console.log(payload);
                parentPort?.postMessage({
                    id,
                    action,
                    payload: {
                        receipt: await actor.buyAtMaximumOutput(
                            payload.amountIn,
                            payload.path,
                            payload.to,
                            payload.deadline,
                            payload.nonce
                        ),
                    },
                });
                break;
            case "coordinateFlashSwap":
                console.log(payload);
                parentPort?.postMessage({
                    id,
                    action,
                    payload: {
                        receipt: await actor.coordinateFlashSwap(
                            payload.exchanges,
                            payload.path,
                            payload.amountIn
                        ),
                    },
                });
                break;
            default:
                console.error(`Unknown action: ${action}`);
        }
    });

    parentPort.on("error", (error) => {
        console.error(`Worker error: ${error}`);
    });
}
