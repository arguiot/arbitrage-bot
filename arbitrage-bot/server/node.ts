import MainActor from "./actors/main";
import { messageTypeSchema } from "./types/request";
import WebSocket from "ws";
import dotenv from "dotenv";
import { ServerWebSocket } from "./types/socket";
import { getAdapter } from "./data/adapters";
import { LiquidityCache } from "./data/priceData";

dotenv.config();

const port = parseInt(process.env.PORT || "8080");

let mainActor = new MainActor();

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

    ws.on("message", (message: WebSocket.Data) => {
        try {
            const data = JSON.parse(message.toString());
            const validatedData = messageTypeSchema.parse(data);

            if (validatedData.type === "subscribe") {
                ws.subscribe(validatedData.topic);
            } else if (validatedData.type === "unsubscribe") {
                ws.unsubscribe(validatedData.topic);
            } else if (validatedData.type === "reset") {
                ws.unsubscribe("priceData");
                mainActor = new MainActor();
                mainActor.start({ ws });
                ws.send(JSON.stringify({ status: "success", topic: "reset" }));
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
                adapter.swapExactTokensForTokens(
                    amountIn,
                    amountOut,
                    [validatedData.query.tokenA, validatedData.query.tokenB],
                    mainActor.wallet.address,
                    Date.now() + 1000 * 60 // 60 seconds allowance
                );

                LiquidityCache.shared.invalidate(
                    exchange,
                    validatedData.query.tokenA.name
                );
                LiquidityCache.shared.invalidate(
                    exchange,
                    validatedData.query.tokenB.name
                );

                console.log("Done buying.");

                ws.send(
                    JSON.stringify({
                        status: "success",
                        topic: "buy",
                        amountOut,
                        amountIn,
                    })
                );
            }

            if (validatedData.topic === "priceData") {
                const query = validatedData.query;
                mainActor.subscribeToPriceData(query);
                ws.send(
                    JSON.stringify({ status: "subscribed", topic: "priceData" })
                );
            } else if (validatedData.topic === "decision") {
                mainActor.broadcastDecisions = true;
                ws.send(
                    JSON.stringify({ status: "subscribed", topic: "decision" })
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

    mainActor = new MainActor(); // Reset the actor
    mainActor.start({ ws });
});
