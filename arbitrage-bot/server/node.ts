import MainActor from "./actors/main";
import { messageTypeSchema } from "./types/request";
import WebSocket from "ws";
import dotenv from "dotenv";
import { ServerWebSocket } from "./types/socket";
import { getAdapter } from "./data/adapters";
import { LiquidityCache } from "./store/LiquidityCache";

dotenv.config();

const port = parseInt(process.env.PORT || "8080");

const mainActor = new MainActor();

console.log(`Server listening on port ${port}, url: http://localhost:${port}`);

interface CustomWebSocket extends WebSocket {
    readonly data: any;
    readonly remoteAddress: string;
    subscribe: (topic: string) => void;
    unsubscribe: (topic: string) => void;
    publish: (topic: string, data: string) => void;
    topics?: string[];
    isSubscribed(topic: string): boolean;
    cork(cb: (ws: ServerWebSocket) => void): void;
}

const server = new WebSocket.Server({ port });

server.on("connection", (ws: CustomWebSocket) => {
    // Implement the websocket polyfill
    ws.subscribe = (topic: string) => {
        ws.topics = ws.topics || [];
        ws.topics.push(topic);
    };

    ws.unsubscribe = (topic: string) => {
        ws.topics = ws.topics || [];
        ws.topics = ws.topics.filter((t) => t !== topic);
    };

    ws.publish = (topic: string, data: string) => {
        ws.topics = ws.topics || [];
        if (ws.topics.includes(topic)) {
            ws.send(data);
        }
    };

    ws.on("message", async (message: WebSocket.Data) => {
        try {
            const data = JSON.parse(message.toString());
            const validatedData = messageTypeSchema.parse(data);

            if (validatedData.type === "subscribe") {
                ws.subscribe(validatedData.topic);
            } else if (validatedData.type === "unsubscribe") {
                ws.unsubscribe(validatedData.topic);
            } else if (validatedData.type === "reset") {
                ws.unsubscribe("priceData");

                mainActor.start({ ws });
                ws.send(
                    JSON.stringify({
                        status: "success",
                        topic: "notify",
                        title: "Reset",
                        message: "Reset successful.",
                    })
                );
            } else if (validatedData.topic === "buy") {
                if (typeof validatedData.query === "undefined")
                    throw new Error("No query specified");
                const exchange = validatedData.query.exchange;
                const amountIn = validatedData.query.amountIn;
                const amountOut = validatedData.query.amountOut;
                if (typeof exchange === "undefined")
                    throw new Error("No exchange specified");
                if (typeof amountIn === "undefined")
                    throw new Error("No amountIn specified");
                if (typeof amountOut === "undefined")
                    throw new Error("No amountOut specified");

                console.log(
                    `Buying ${amountOut} ${validatedData.query.tokenB.name} for ${amountIn} ${validatedData.query.tokenA.name} on ${exchange}`
                );

                const adapter = getAdapter(
                    exchange,
                    mainActor.wallet,
                    validatedData.query.routerAddress,
                    validatedData.query.factoryAddress
                );

                const receipt = await adapter.buyAtMinimumInput(
                    amountOut,
                    [validatedData.query.tokenA, validatedData.query.tokenB],
                    mainActor.wallet.address,
                    Date.now() + 1000 * 120 // 120 seconds allowance
                );

                const liquidityCache = new LiquidityCache(mainActor.memory);

                await liquidityCache.invalidate(
                    exchange,
                    validatedData.query.tokenA.name
                );
                await liquidityCache.invalidate(
                    exchange,
                    validatedData.query.tokenB.name
                );

                console.log("Done buying.");

                ws.send(
                    JSON.stringify({
                        status: "success",
                        topic: "buy",
                        receipt,
                    })
                );
            }

            if (validatedData.topic === "priceData") {
                const query = validatedData.query;
                mainActor.subscribeToPriceData(query);
                ws.send(
                    JSON.stringify({
                        status: "success",
                        topic: "notify",
                        title: "Subscribed",
                        message: `Watching price on ${query?.exchange}.`,
                    })
                );
            } else if (validatedData.topic === "decision") {
                mainActor.broadcastDecisions =
                    validatedData.type === "subscribe";
                mainActor.decisionPeer.locked =
                    validatedData.type !== "subscribe";
                ws.send(
                    JSON.stringify({
                        status: `${validatedData.type}d`,
                        topic: "decision",
                    })
                );
            }
        } catch (e) {
            console.error(e);
            ws.send(JSON.stringify({ error: e }));
        }
    });

    ws.on("close", (code: number, message: string) => {
        ws.unsubscribe("priceData");
    });

    mainActor.start({ ws });
});
