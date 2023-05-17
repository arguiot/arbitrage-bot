import MainActor from "./actors/main";
import { ServerWebSocket } from "./types/socket";
import { messageTypeSchema } from "./types/request";

const mainActor = new MainActor();

console.log("Server listening on port 8080, url: http://localhost:8080")

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
                }

                if (validatedData.topic === "priceData") {
                    const query = validatedData.query;
                    mainActor.subscribeToPriceData(query);
                    ws.send("{ \"status\": \"subscribed\", \"topic\": \"priceData\" }")
                }
            } catch (e) {
                ws.send(JSON.stringify({ error: e }))
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
}


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
        },
    ): boolean;
}
