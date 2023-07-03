//
//  BuilderStep.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 03/07/2023.
//

import Foundation
import Euler

class BuilderStep {
    var next: BuilderStep? = nil
    
    var reserveFeeInfos: [ReserveFeeInfo]?
    
    init(tokenA: Token, tokenB: Token, adjacencyList: AdjacencyList) async {
        self.reserveFeeInfos = await adjacencyList
            .getReserves(tokenA: tokenA, tokenB: tokenB)
    }
    
    enum BuilderStepError: Error {
        case noReserve
        case arrayTooSmall
    }
    
    func price(for amount: Euler.BigInt, chain: [ReserveFeeInfo] = []) async throws -> (Euler.BigInt, [ReserveFeeInfo])  {
        guard let reserveFeeInfos = self.reserveFeeInfos else {
            throw BuilderStepError.noReserve
        }
        
        let (currentPrice, info) = try await reserveFeeInfos.concurrentMap({ info in
            (try await info.calculatedQuote(with: amount), info)
        }).reduce((0, reserveFeeInfos[0]), { max($0.0, $1.0) == $0.0 ? $0 : $1 })
        
        var chain = chain
        chain.append(info)
        
        if let next = next {
            return try await next.price(for: currentPrice, chain: chain)
        }
        
        return (currentPrice, chain)
    }
}
