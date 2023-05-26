export interface ServerWebSocket {
    readonly data: any;
    readonly readyState: 0 | 1 | 2 | 3;
    readonly remoteAddress: string;
    send(data: any, cb?: (err?: Error) => void): void;
    send(
        data: any,
        options: {
            mask?: boolean | undefined;
            binary?: boolean | undefined;
            compress?: boolean | undefined;
            fin?: boolean | undefined;
        },
        cb?: (err?: Error) => void
    ): void;
    close(code?: number, reason?: string): void;
    subscribe(topic: string): void;
    unsubscribe(topic: string): void;
    publish(topic: string, message: string | ArrayBuffer | Uint8Array): void;
    isSubscribed(topic: string): boolean;
    cork(cb: (ws: ServerWebSocket) => void): void;
}
