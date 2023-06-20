//
//  File.swift
//  
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
import OpenCombine
import Vapor

class PriceDataController<T>: Subject where T: Exchange {
    typealias Output = BotResponse
    typealias Failure = Error
    
    var subscribers: [WebSocket] = []
    
    func receive<Subscriber>(subscriber: Subscriber) where Subscriber : OpenCombine.Subscriber, Failure == Subscriber.Failure, BotResponse == Subscriber.Input {
        let subscription = PriceDataSubscription<Subscriber>()
        subscription.target = subscriber
        
        // Attaching our subscription to the subscriber:
        subscriber.receive(subscription: subscription)
        if let socket = subscriber as? WebSocket {
            subscribers.append(socket)
        }
    }
    
    class PriceDataSubscription<Target: Subscriber>: Subscription {
        var target: Target?
        
        
        func request(_ demand: OpenCombine.Subscribers.Demand) {
            // We don't care about demand because we're going to
            // send data whenever we want to anyway.
        }
        
        func cancel() {
            // When our subscription was cancelled, we'll release
            // the reference to our target to prevent any
            // additional events from being sent to it:
            target = nil
        }
    }
    
    func send(_ value: BotResponse) {
        for subscriber in subscribers {
            _ = subscriber.receive(value)
        }
    }
    
    func send(completion: OpenCombine.Subscribers.Completion<Failure>) {
        for subscriber in subscribers {
            subscriber.receive(completion: completion)
        }
    }
    
    func send(subscription: OpenCombine.Subscription) {
        for subscriber in subscribers {
            subscriber.receive(subscription: subscription)
        }
    }
}
