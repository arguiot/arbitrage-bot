import MainActor from "./actors/main";
import { ServerWebSocket } from "./types/socket";
import { messageTypeSchema } from "./types/request";
import { getAdapter } from "./data/adapters";
import { LiquidityCache } from "./data/priceData";

type HeadersInit = Headers | string[][] | Record<string, string>;
interface Server {
    pendingWebsockets: number;
    publish(
        topic: string,
        data: string | ArrayBufferView | ArrayBuffer,
        compress?: boolean
    ): number;
    upgrade(
        req: Request,
        options?: {
            headers?: HeadersInit;
            data?: any;
        }
    ): boolean;
}

let mainActor = new MainActor();

console.log("Server listening on port 8080, url: http://localhost:8080");

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
        message(
            ws: ServerWebSocket,
            message: string | ArrayBuffer | Uint8Array
        ) {
            try {
                const data = JSON.parse(message as string);
                const validatedData = messageTypeSchema.parse(data);

                if (validatedData.type === "subscribe") {
                    ws.subscribe(validatedData.topic);
                } else if (validatedData.type === "unsubscribe") {
                    ws.unsubscribe(validatedData.topic);
                } else if (validatedData.type === "reset") {
                    ws.unsubscribe("priceData");
                    mainActor = new MainActor();
                    mainActor.start({ ws });
                    ws.send(
                        JSON.stringify({ status: "success", topic: "reset" })
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
                    adapter.swapExactTokensForTokens(
                        amountIn,
                        amountOut,
                        [
                            validatedData.query.tokenA,
                            validatedData.query.tokenB,
                        ],
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
                        JSON.stringify({
                            status: "subscribed",
                            topic: "priceData",
                        })
                    );
                } else if (validatedData.topic === "decision") {
                    ws.send(
                        JSON.stringify({
                            status: "subscribed",
                            topic: "decision",
                        })
                    );
                }
            } catch (e) {
                ws.send(JSON.stringify({ error: e }));
            }
        }, // a message is received
        open(ws: ServerWebSocket) {
            mainActor.start({ ws }); // Starts the main actor
        }, // a socket is opened
        close(ws, code, message) {
            ws.unsubscribe("priceData");
        }, // a socket is closed
        drain(ws) { }, // the socket is ready to receive more data
    },
};
