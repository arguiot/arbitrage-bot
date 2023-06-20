//
//  PriceDataPublisher.swift
//
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
import OpenCombine
import Vapor

class PriceDataPublisher<T>: Subject where T: Exchange {
    typealias Output = BotResponse
    typealias Failure = Error
    
    var subscribers = Dictionary<WebSocket, Set<PairInfo>>()
    
    func receive<Subscriber>(subscriber: Subscriber) where Subscriber : OpenCombine.Subscriber, Failure == Subscriber.Failure, BotResponse == Subscriber.Input {
        if let socket = subscriber as? WebSocket {
            let subscription = PriceDataSubscription<WebSocket>()
            subscription.target = socket
            
            // Attaching our subscription to the subscriber:
            subscriber.receive(subscription: subscription)
            
            if subscribers[socket] == nil {
                subscribers[socket] = Set()
            }
        }
    }
    
    class PriceDataSubscription<Target: Subscriber>: Subscription where Target == WebSocket {
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
            _ = subscriber.key.receive(value)
        }
    }
    
    func send(completion: OpenCombine.Subscribers.Completion<Failure>) {
        for subscriber in subscribers {
            subscriber.key.receive(completion: completion)
        }
    }
    
    func send(subscription: OpenCombine.Subscription) {
        for subscriber in subscribers {
            subscriber.key.receive(subscription: subscription)
        }
    }
}
