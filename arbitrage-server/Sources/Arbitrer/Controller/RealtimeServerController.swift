//
//  RealtimeServerController.swift
//  Arbitrage-Bot
//
//  Created by Arthur Guiot on 23/06/2023.
//

import Foundation


actor RealtimeServerController {
    var callback: (String) -> Void
    var subscriber: PriceDataSubscriber
    
    public init(callback: @escaping (String) -> Void) {
        self.callback = callback
        self.subscriber = PriceDataSubscriber { res in
            guard let str = try? res.toJSON() else { return }
            callback(str)
        }
        // Publishers
        Task {
            await PriceDataPublisher.shared.receive(subscriber: subscriber)
        }
    }
    
    // MARK: - Request
    func handleRequest(request: String) async throws {
        let botRequest = try BotRequest.fromJSON(jsonString: request)
        
        let response = switch botRequest.topic {
        case .priceData:
            await priceData(request: botRequest)
        case .decision:
            await decision(request: botRequest)
        case .reset:
            await reset(request: botRequest)
        case .buy:
            await buy(request: botRequest)
        case .none:
            BotResponse(status: .success, topic: .none)
        }
        
        self.callback(try response.toJSON())
    }
    
    func priceData(request: BotRequest) async -> BotResponse {
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
    
    func decision(request: BotRequest) async -> BotResponse {
        return BotResponse(status: .success, topic: .decision)
    }
    
    func reset(request: BotRequest) async -> BotResponse {
        return BotResponse(status: .success, topic: .reset)
    }
    
    func buy(request: BotRequest) async -> BotResponse {
        return BotResponse(status: .success, topic: .buy)
    }
}


@objc public class RealtimeServerControllerWrapper: NSObject {
    private var serverController: RealtimeServerController
    
    @objc public init(callback: @escaping (String) -> Void) {
        serverController = RealtimeServerController(callback: callback)
        super.init()
    }
    
    @objc public func handleRequest(request: String, completion: @escaping (Error?) -> Void) {
        Task {
            do {
                try await serverController.handleRequest(request: request)
            } catch {
                completion(error)
            }
        }
    }
}
