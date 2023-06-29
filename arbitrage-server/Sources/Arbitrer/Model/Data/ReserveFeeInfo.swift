//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import Euler


struct ReserveFeeInfo: CustomStringConvertible {
    let exchangeKey: KeyPath<ExchangesList, any Exchange>
    var exchange: any Exchange {
        ExchangesList.shared[keyPath: self.exchangeKey]
    }
    
    let tokenA: Token
    let tokenB: Token
    
    let meta: Any
    
    var spotAB: Double? = nil
    var spotBA: Double? = nil
    
    func spot(_ tokenA: Token, _ tokenB: Token) -> Double? {
        tokenA < tokenB ? spotAB : spotBA
    }
    
    let fee: BigInt
    
    init(exchangeKey: KeyPath<ExchangesList, any Exchange>, meta: Any, spot: Double, tokenA: Token, tokenB: Token, fee: BigInt) {
        self.exchangeKey = exchangeKey
        self.meta = meta
        self.spotAB = tokenA < tokenB ? spot : self.spotAB
        self.spotBA = tokenB < tokenA ? spot : self.spotBA
        self.fee = fee
        self.tokenA = tokenA < tokenB ? tokenA : tokenB
        self.tokenB = tokenA < tokenB ? tokenB : tokenA
    }
    
    func calculatedQuote(with amount: BigInt?, aToB: Bool = true) async throws -> Quote {
        return try await ReserveFeeInfo.calculatedQuote(for: self.exchange,
                                                        with: amount,
                                                        tokenA: aToB ? tokenA : tokenB,
                                                        tokenB: aToB ? tokenB : tokenA,
                                                        using: self.meta)
    }
    
    static func calculatedQuote<T: Exchange>(for exchange: T, with amount: BigInt?, tokenA: Token, tokenB: Token, using meta: Any) async throws -> Quote {
        return try await exchange.getQuote(maxAvailableAmount: amount,
                                       tokenA: tokenA,
                                       tokenB: tokenB,
                                       maximizeB: true,
                                           meta: meta as? T.Meta).0
    }
    
    public var description: String {
        return "\(ExchangesList.shared[keyPath: exchange.path].name) - \((spotAB ?? 1 / (spotBA ?? 0)))"
    }
}
