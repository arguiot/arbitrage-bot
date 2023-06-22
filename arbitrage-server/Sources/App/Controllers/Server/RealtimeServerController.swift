//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation
import Vapor
import Arbitrer

actor RealtimeServerController {
    var ws: WebSocket
    var subscriber: PriceDataSubscriber
    
    init(ws: WebSocket) {
        self.ws = ws
        self.subscriber = PriceDataSubscriber { res in
            guard let str = try? res.toJSON() else { return }
            ws.send(str)
        }
        // Publishers
        Task {
            await PriceDataPublisher.shared.receive(subscriber: subscriber)
        }
    }
    
    // MARK: - Request
    func handleRequest(request: BotRequest, ws: WebSocket) async throws {
        let response = switch request.topic {
        case .priceData:
            await priceData(request: request, ws: ws)
        case .decision:
            await decision(request: request, ws: ws)
        case .reset:
            await reset(request: request, ws: ws)
        case .buy:
            await buy(request: request, ws: ws)
        case .none:
            BotResponse(status: .success, topic: .none)
        }
        
        try await ws.send(try response.toJSON())
    }
    
    func priceData(request: BotRequest, ws: WebSocket) async -> BotResponse {
        guard let query = request.query else {
            return BotResponse(status: .error, topic: .priceData)
        }
        let pair = PairInfo(tokenA: query.tokenA, tokenB: query.tokenB)
        
        let activeSub = PriceDataActiveSubscription(exchangeKey: query.exchange,
                                                    environment: request.environment,
                                                    pair: pair)
        
        if request.type == .subscribe {
            self.subscriber.activeSubscriptions.append(activeSub)
        } else {
            self.subscriber.activeSubscriptions.removeAll { sub in
                activeSub == sub
            }
        }
        
        return BotResponse(status: .success, topic: .priceData)
    }
    
    func decision(request: BotRequest, ws: WebSocket) async -> BotResponse {
        return BotResponse(status: .success, topic: .decision)
    }
    
    func reset(request: BotRequest, ws: WebSocket) async -> BotResponse {
        return BotResponse(status: .success, topic: .reset)
    }
    
    func buy(request: BotRequest, ws: WebSocket) async -> BotResponse {
        return BotResponse(status: .success, topic: .buy)
    }
}
