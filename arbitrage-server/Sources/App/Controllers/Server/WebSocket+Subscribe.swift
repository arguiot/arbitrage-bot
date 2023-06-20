//
//  File.swift
//  
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
import Vapor
import OpenCombine

extension WebSocket: Subscriber {
    public typealias Input = BotResponse
    public typealias Failure = Error
    
//    var subscription: OpenCombine.Subscription?
    
    public func receive(subscription: OpenCombine.Subscription) {
//        self.subscription = subscription
    }
    
    public func receive(_ input: BotResponse) -> OpenCombine.Subscribers.Demand {
        Task {
            try await self.send(try input.toJSON())
        }
        return .none
    }
    
    public func receive(completion: OpenCombine.Subscribers.Completion<Failure>) {
        switch completion {
        case .finished:
            break;
        case .failure(let error):
            Task {
                // Send it back to the client
                let response = BotResponse(status: .error, topic: .none, error: error.localizedDescription)
                guard let json = try? response.toJSON() else {
                    try? await self.send("Unknown JSON error while encoding the error message.")
                    return
                }
                try? await self.send(json)
            }
        }
    }
}
