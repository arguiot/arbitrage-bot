//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation

final actor PriceDataSubscriptionState {
    struct PriceDataActiveSubscription: Hashable {
        var exchangeKey: String
        var environment: BotRequest.Environment
        var pair: PairInfo
    }
    var activeSubscriptions = Set<PriceDataActiveSubscription>()
    
    func meanPrice(for type: PriceDataSubscriptionType) async -> [BotResponse] {
        return await withThrowingTaskGroup(of: BotResponse.self, returning: [BotResponse].self) { taskGroup in
            let subs: [(any Exchange, PairInfo)] = activeSubscriptions.compactMap { activeSubscription in
                guard let adapter = ExchangesList[activeSubscription.environment]?[activeSubscription.exchangeKey] else { return nil }
                guard adapter.trigger == type else { return nil }
                return (adapter, activeSubscription.pair)
            }
            
            for (exchange, pair) in subs {
                taskGroup.addTask {
                    return try await self.meanPrice(for: exchange, with: pair)
                }
            }
        }
    }
    
    func meanPrice<T: Exchange>(for exchange: T, with pair: PairInfo) async throws -> BotResponse {
        let meanPrice = try await exchange.meanPrice(tokenA: pair.tokenA, tokenB: pair.tokenB)
        
        var response = BotResponse(status: .success, topic: .priceData)
        response.quote = meanPrice
        return response
    }
}
