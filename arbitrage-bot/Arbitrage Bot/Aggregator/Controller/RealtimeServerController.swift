//
//  RealtimeServerController.swift
//  Arbitrage-Bot
//
//  Created by Arthur Guiot on 23/06/2023.
//

import Foundation


actor RealtimeServerController {
    var callback: (String) -> Void
    var priceSubscriber: PriceDataSubscriber
    var priceDataStore: PriceDataStoreWrapper? = nil
    
    var decisionSubscriber: DecisionDataSubscriber
    
    public init(id: Int, callback: @escaping (String) -> Void) {
        self.callback = callback
        self.priceSubscriber = PriceDataSubscriber { res in
            guard let str = try? res.toJSON() else { return }
            if controllers.keys.contains(id) {
                callback(str)
            }
        }
        self.decisionSubscriber = DecisionDataSubscriber { res in
            guard let str = try? res.toJSON() else { return }
            if controllers.keys.contains(id) {
                callback(str)
            }
        }
        
        // Publishers
        PriceDataPublisher.shared.receive(subscriber: priceSubscriber)
        DecisionDataPublisher.shared.receive(subscriber: decisionSubscriber)
    }
    
    func setPriceDataStore(with store: PriceDataStoreWrapper) {
        self.priceDataStore = store;
    }
    
    // MARK: - Request
    func handleRequest(request: String) async throws {
        let botRequest = try BotRequest.fromJSON(jsonString: request)
        
        let response: BotResponse
        
        switch botRequest.topic {
        case .priceData:
            response = await priceData(request: botRequest)
        case .decision:
            response = await decision(request: botRequest)
        case .reset:
            response = await reset(request: botRequest)
        case .buy:
            response = await buy(request: botRequest)
        case .none:
            response = BotResponse(status: .success, topic: .none)
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
            self.priceSubscriber.activeSubscriptions.append(activeSub)
        } else {
            self.priceSubscriber.activeSubscriptions.removeAll { sub in
                activeSub == sub
            }
        }
        
        return BotResponse(status: .success, topic: .priceData)
    }
    
    func decision(request: BotRequest) async -> BotResponse {
        if request.type == .subscribe {
            PriceDataPublisher.shared.priceDataSubscription.decisions = true
        } else {
            PriceDataPublisher.shared.priceDataSubscription.decisions = false
        }
        
        return BotResponse(status: .success, topic: .decision)
    }
    
    func reset(request: BotRequest) async -> BotResponse {
        // Restart the server
        self.priceSubscriber.activeSubscriptions.removeAll()
        PriceDataPublisher.shared
            .priceDataSubscription
            .subscriptions
            .activeSubscriptions
            .removeAll()
        
        return BotResponse(status: .success, topic: .reset)
    }
    
    func buy(request: BotRequest) async -> BotResponse {
        return BotResponse(status: .success, topic: .buy)
    }
}


class RealtimeServerControllerWrapper {
    // For simplicity in this example, I will assume that
    // the callback takes a C string.
    internal var serverController: RealtimeServerController
    
    init(id: Int, userData: UnsafeRawPointer, callback: @escaping (@convention(c) (UnsafePointer<CChar>, UInt16, UnsafeRawPointer) -> Void)) {
        self.serverController = RealtimeServerController(id: id, callback: { message in
            var message = message
            message.withCString { cMessage in
                callback(cMessage, UInt16(message.count), userData)
            }
        })
    }
    
    public func handleRequest(request: String, completion: @escaping (Error) -> Void) {
        Task {
            do {
                try await serverController.handleRequest(request: request)
            } catch {
                completion(error)
            }
        }
    }
}


// To mimic a reference to the class we can use a Dictionary
var controllers: [Int: RealtimeServerControllerWrapper] = [:]
