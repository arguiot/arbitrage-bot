export interface PartialResult {
    topic: string;
    error?: any;
    [key: string]: any;
}

export interface Actor<T, U extends T = T> {
    /// Receive a signal from the actor's parent.
    receive(fromLoop?: string): Promise<PartialResult>;
    /// Add a child actor.
    addPeer(peer: Actor<U>): void;
    /// Remove a child actor.
    removePeer(peer: Actor<U>): void;
}
