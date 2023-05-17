import MainActor from "./actors/main";
import { messageTypeSchema } from "./types/request";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 8080;

const mainActor = new MainActor();

console.log(`Server listening on port ${port}, url: http://localhost:${port}`);

const server = new WebSocket.Server({ port });

server.on("connection", (ws: WebSocket) => {
    ws.on("message", (message: WebSocket.Data) => {
        try {
            const data = JSON.parse(message.toString());
            const validatedData = messageTypeSchema.parse(data);

            if (validatedData.type === "subscribe") {
                ws.subscribe(validatedData.topic);
            } else if (validatedData.type === "unsubscribe") {
                ws.unsubscribe(validatedData.topic);
            }

            if (validatedData.topic === "priceData") {
                const query = validatedData.query;
                mainActor.subscribeToPriceData(query);
                ws.send(
                    JSON.stringify({ status: "subscribed", topic: "priceData" })
                );
            }
        } catch (e) {
            ws.send(JSON.stringify({ error: e }));
        }
    });

    ws.on("close", (code: number, message: string) => {
        ws.unsubscribe("priceData");
    });

    mainActor.start({ ws });
});
