//
//  PriceDataSubscriber.swift
//
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import OpenCombine

public class PriceDataSubscriber: Subscriber {
    public typealias Input = (BotResponse, Int)
    public typealias Failure = Error
    
    public var callback: (BotResponse) -> Void
    
    internal var subscriptions = Set<Int>()
    
    public var activeSubscriptions: [PriceDataActiveSubscription] {
        get {
            PriceDataPublisher.shared.priceDataSubscription.subscriptions.activeSubscriptions.filter { subscription in
                subscriptions.contains(subscription.hashValue)
            }
        }
        
        set {
            subscriptions.removeAll(keepingCapacity: true)
            newValue.forEach { subscription in
                subscriptions.insert(subscription.hashValue)
                PriceDataPublisher.shared
                    .priceDataSubscription
                    .subscriptions
                    .activeSubscriptions
                    .insert(subscription)
            }
            let all = controllers.values.reduce(Set<Int>(), { partialResult, wrapper in
                partialResult.union(wrapper.serverController.priceSubscriber.subscriptions)
            })
            PriceDataPublisher.shared
                .priceDataSubscription
                .subscriptions
                .activeSubscriptions = PriceDataPublisher.shared
                .priceDataSubscription
                .subscriptions
                .activeSubscriptions
                .filter { subscription in
                    all.contains(subscription.hashValue)
                }
        }
    }
    
    public init(callback: @escaping (BotResponse) -> Void) {
        self.callback = callback
    }
    
    public func receive(subscription: Subscription) {
        subscription.request(.unlimited)
    }
    
    public func receive(_ input: (BotResponse, Int)) -> Subscribers.Demand {
        if subscriptions.contains(input.1) {
            callback(input.0)
        }
        return .none
    }
    
    public func receive(completion: Subscribers.Completion<Error>) {
        print("Completed")
    }
}
