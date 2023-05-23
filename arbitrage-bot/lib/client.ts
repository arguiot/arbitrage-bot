"use client";

import { Token } from "../scripts/exchanges/adapters/exchange";
import usePriceStore from "./priceDataStore";
import { create } from "zustand";
interface WebSocket {
    onclose: ((event: CloseEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onopen: ((event: Event) => void) | null;
    close(code?: number, reason?: string): void;
    send(data: string | ArrayBuffer | Blob | ArrayBufferView): void;
}

export const useClientState = create((set) => ({
    connected: false,
    setConnnected: (connected: boolean) => set({ connected }),
}));

export class Client {
    url = "ws://localhost:8080/";
    ws: WebSocket;
    reconnectTimer: any;

    static shared: Client;

    constructor() {
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
        this.ws.onclose = this.onClose.bind(this);
    }

    onOpen() {
        console.log("Connected to server");
        useClientState.getState().setConnnected(true);
        clearTimeout(this.reconnectTimer);
    }

    onClose() {
        console.log("Disconnected from server");
        useClientState.getState().setConnnected(false);
        this.reconnectTimer = setTimeout(() => this.connect(), 1000);
    }

    onMessage(event: MessageEvent) {
        const message = JSON.parse(event.data);
        switch (message.topic) {
            case "priceData":
                if (typeof message.quote !== "undefined") {
                    usePriceStore.getState().addQuote(message.exchange, message.quote);
                }
                break;
            default:
                console.log("Unknown message", message);
        }
    }

    send(message: string) {
        if (this.ws.readyState !== WebSocket.OPEN) {
            console.log("Websocket not open, not sending message", message);
            setTimeout(() => this.send(message), 1000);
        }
        this.ws.send(message);
    }

    // MARK: - Exchange messages with server

    subscribeToPriceData(exchange: string, type: "dex" | "cex", tokenA: Token, tokenB: Token) {
        this.send(JSON.stringify({
            type: "subscribe",
            topic: "priceData",
            query: {
                exchange,
                type,
                tokenA,
                tokenB
            },
        }));
    }
}
