export interface PartialResult {
    topic: string;
    error?: any;
    [key: string]: any;
}

export interface Actor<T, U extends T = T> {
    /// Receive a signal from the actor's parent.
    receive(options: T): Promise<PartialResult>;
    /// Add a child actor.
    addPeer(topic: string, type: any, query: any): void;
}
