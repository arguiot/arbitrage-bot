export interface ServerWebSocket {
    readonly data: any;
    readonly readyState: number;
    readonly remoteAddress: string;
    send(
        message: string | ArrayBuffer | Uint8Array,
        compress?: boolean
    ): number;
    close(code?: number, reason?: string): void;
    subscribe(topic: string): void;
    unsubscribe(topic: string): void;
    publish(topic: string, message: string | ArrayBuffer | Uint8Array): void;
    isSubscribed(topic: string): boolean;
    cork(cb: (ws: ServerWebSocket) => void): void;
}
