//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation
import Vapor

class RealtimeServerController {
    
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
    
    static let shared = RealtimeServerController()
}
