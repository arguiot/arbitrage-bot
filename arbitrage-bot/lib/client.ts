"use client";

import { Token } from "../scripts/exchanges/adapters/exchange";
import { ExchangesList } from "./exchanges";
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
    decisions: false,
    buy: null,
    buying: false,
    setConnnected: (connected: boolean) => set({ connected }),
    setDecisions: (decisions: boolean) => set({ decisions }),
    setBuy: (buy: any | null) => set({ buy }),
    setBuying: (buying: boolean) => {
        if (buying === false) {
            set({ buying, buy: null });
        } else {
            set({ buying });
        }
    },
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
                    usePriceStore.getState().addQuote(message.exchange, {
                        ...message.quote,
                        balanceA: message.balanceA,
                        balanceB: message.balanceB,
                    });
                }
                break;
            case "buy":
                if (message.status === "success") {
                    useClientState.getState().setBuying(false);
                }
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

    subscribeToPriceData(
        exchange: string,
        environment: "development" | "production",
        tokenA: Token,
        tokenB: Token
    ) {
        const exchangeMetadata = ExchangesList[environment][exchange];
        this.send(
            JSON.stringify({
                type: "subscribe",
                topic: "priceData",
                query: {
                    exchange,
                    type: exchangeMetadata.type,
                    tokenA,
                    tokenB,
                    routerAddress: exchangeMetadata.routerAddress,
                    factoryAddress: exchangeMetadata.factoryAddress,
                },
            })
        );
    }

    subscribeToDecision() {
        this.send(
            JSON.stringify({
                type: "subscribe",
                topic: "decision",
            })
        );
    }

    buy(
        exchange: string,
        environment: "development" | "production",
        tokenA: Token,
        tokenB: Token,
        amountOfA: number,
        amountOfB: number
    ) {
        useClientState.getState().setBuying(true);
        const exchangeMetadata = ExchangesList[environment][exchange];
        this.send(
            JSON.stringify({
                type: "buy",
                topic: "buy",
                query: {
                    exchange,
                    type: exchangeMetadata.type,
                    tokenA,
                    tokenB,
                    amountIn: amountOfA,
                    amountOut: amountOfB,
                    routerAddress: exchangeMetadata.routerAddress,
                    factoryAddress: exchangeMetadata.factoryAddress,
                },
            })
        );
    }

    reset() {
        this.send(
            JSON.stringify({
                type: "reset",
                topic: "reset",
            })
        );
    }
}
