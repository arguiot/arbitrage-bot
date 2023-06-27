//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import Euler

struct ReserveFeeInfo<Meta>: Hashable {
    let exchange: AnyExchange
    let meta: Meta
    let spot: BigDouble
    let fee: BigInt
    
    func calculatedQuote(with amount: BigInt?, tokenA: Token, tokenB: Token) async throws -> Quote {
        return try await exchange.getQuote(maxAvailableAmount: amount,
                                       tokenA: tokenA,
                                       tokenB: tokenB,
                                       maximizeB: true,
                                       meta: self.meta).0
    }
    
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.exchange)
    }
    
    static func == (lhs: ReserveFeeInfo<Meta>, rhs: ReserveFeeInfo<Meta>) -> Bool {
        lhs.exchange == rhs.exchange
    }
}
