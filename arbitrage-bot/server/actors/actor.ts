import { SharedMemory } from "../store/SharedMemory";

export interface PartialResult {
    topic: string;
    error?: any;
    [key: string]: any;
}

export interface Actor<T, U extends T = T> {
    memory: SharedMemory;
    /// Receive a signal from the actor's parent.
    receive(options: T): Promise<PartialResult>;
    /// Add a child actor.
    addPeer(topic: string, type: any, query: any): void;
}
