//
//  PriceDataSubscriber.swift
//
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import OpenCombine

public class PriceDataSubscriber: Subscriber {
    public typealias Input = BotResponse
    public typealias Failure = Error
    
    public var callback: (BotResponse) -> Void
    
    var activeSubscriptions = Set<Int>()
    
    public init(callback: @escaping (BotResponse) -> Void) {
        self.callback = callback
    }
    
    public func receive(subscription: Subscription) {
        subscription.request(.unlimited)
    }
    
    public func receive(_ input: BotResponse) -> Subscribers.Demand {
        callback(input)
        return .none
    }
    
    public func receive(completion: Subscribers.Completion<Error>) {
        print("Completed")
    }
}
