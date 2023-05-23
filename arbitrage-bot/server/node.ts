import MainActor from "./actors/main";
import { messageTypeSchema } from "./types/request";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 8080;

let mainActor = new MainActor();

console.log(`Server listening on port ${port}, url: http://localhost:${port}`);

const server = new WebSocket.Server({ port });

server.on("connection", (ws: WebSocket) => {

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
            }

            if (validatedData.topic === "priceData") {
                const query = validatedData.query;
                mainActor.subscribeToPriceData(query);
                ws.send(
                    JSON.stringify({ status: "subscribed", topic: "priceData" })
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
