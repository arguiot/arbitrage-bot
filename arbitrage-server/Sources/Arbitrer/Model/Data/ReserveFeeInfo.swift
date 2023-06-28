//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import Euler


struct ReserveFeeInfo {
    let exchangeKey: KeyPath<ExchangesList, any Exchange>
    var exchange: any Exchange {
        ExchangesList.shared[keyPath: self.exchangeKey]
    }
    let meta: Any
    let _spot: Double
    
    var spot: Double {
        swap ? 1 / _spot : _spot
    }
    
    let fee: BigInt
    var swap: Bool = false
    
    init(exchangeKey: KeyPath<ExchangesList, any Exchange>, meta: Any, spot: Double, fee: BigInt) {
        self.exchangeKey = exchangeKey
        self.meta = meta
        self._spot = spot
        self.fee = fee
    }
    
    func calculatedQuote(with amount: BigInt?, tokenA: Token, tokenB: Token) async throws -> Quote {
        return try await ReserveFeeInfo.calculatedQuote(for: self.exchange,
                                                        with: amount,
                                                        tokenA: tokenA,
                                                        tokenB: tokenB,
                                                        using: self.meta)
    }
    
    static func calculatedQuote<T: Exchange>(for exchange: T, with amount: BigInt?, tokenA: Token, tokenB: Token, using meta: Any) async throws -> Quote {
        return try await exchange.getQuote(maxAvailableAmount: amount,
                                       tokenA: tokenA,
                                       tokenB: tokenB,
                                       maximizeB: true,
                                           meta: meta as? T.Meta).0
    }
}
