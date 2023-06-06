import MainActor from "./actors/main";
import { ServerWebSocket } from "./types/socket";
import { messageTypeSchema } from "./types/request";
import { getAdapter } from "./data/adapters";
import { LiquidityCache } from "./store/LiquidityCache";

console.log("Server listening on port 8080, url: http://localhost:8080");

let mainActor = new MainActor();

interface Server {
    development: boolean;
    hostname: string;
    port: number;
    pendingRequests: number;
    stop(): void;
}

export default {
    port: 8080,
    fetch(req: Request, server: Server) {
        // upgrade the request to a WebSocket
        if (server.upgrade(req)) {
            return; // do not return a Response
        }
        return new Response("Upgrade failed :(", { status: 500 });
    },
    websocket: {
        async message(
            ws: ServerWebSocket,
            message: string | ArrayBuffer | Uint8Array
        ) {
            try {
                const data = JSON.parse(message as string);
                const validatedData = messageTypeSchema.parse(data);

                if (validatedData.type === "subscribe") {
                    ws.subscribe(validatedData.topic);
                    ws.send(
                        JSON.stringify({
                            status: "success",
                            topic: "notify",
                            title: "Subscribed",
                            message: `Subscribed to ${validatedData.topic}.`,
                        })
                    );
                } else if (validatedData.type === "unsubscribe") {
                    ws.unsubscribe(validatedData.topic);
                } else if (validatedData.type === "reset") {
                    ws.unsubscribe("priceData");
                    mainActor = new MainActor();
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
                        [
                            validatedData.query.tokenA,
                            validatedData.query.tokenB,
                        ],
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
                            status: "subscribed",
                            topic: "priceData",
                        })
                    );
                } else if (validatedData.topic === "decision") {
                    mainActor.broadcastDecisions =
                        validatedData.type === "subscribe";
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
        }, // a message is received
        open(ws: ServerWebSocket) {
            mainActor.start({ ws }); // Starts the main actor
        }, // a socket is opened
        close(ws: ServerWebSocket, _code, _message) {
            ws.unsubscribe("priceData");
        }, // a socket is closed
        drain(ws: ServerWebSocket) {}, // the socket is ready to receive more data
    },
};
