//
//  BuilderStep.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 03/07/2023.
//

import Foundation
import Euler
#if canImport(AppKit)
import AppKit
#endif

class BuilderStep {
    var next: BuilderStep? = nil
    
    var reserveFeeInfos: [ReserveFeeInfo]?
    
    #if canImport(AppKit)
    var window: NSWindow?
    #endif
    
    
    init(tokenA: Token, tokenB: Token, adjacencyList: AdjacencyList) async {
        self.reserveFeeInfos = await adjacencyList
            .getReserves(tokenA: tokenA, tokenB: tokenB)
    }
    
    init(reserveFeeInfos: [ReserveFeeInfo]) {
        self.reserveFeeInfos = reserveFeeInfos
    }
    
    enum BuilderStepError: Error {
        case noReserve
        case arrayTooSmall
    }
    
    func price(for amount: Euler.BigInt, chain: [Step] = []) throws -> (Euler.BigInt, [Step])  {
        guard let reserveFeeInfos = self.reserveFeeInfos else {
            throw BuilderStepError.noReserve
        }
        
        let (currentPrice, info) = try reserveFeeInfos.map({ info in
                (try info.fastQuote(with: amount), info)
            })
            .reduce((0, reserveFeeInfos[0]), { max($0.0, $1.0) == $0.0 ? $0 : $1 })
        
        var chain = chain
        if let coordinator = info.exchange.coordinator,
           let intermediaryStepData = info.exchange.intermediaryStepData {
            let step = Step(intermediary: coordinator,
                            token: info.tokenA.address,
                            data: intermediaryStepData)
            chain.append(step)
            if next == nil {
                let step = Step(intermediary: coordinator,
                                token: info.tokenB.address,
                                data: intermediaryStepData)
                chain.append(step)
            }
        }
        if let next = next {
            return try next.price(for: currentPrice, chain: chain)
        }
        
        return (currentPrice, chain)
    }
    
    var description: String {
        let path = [self.reserveFeeInfos?.first?.tokenA.name,
                    " -> ",
                    self.reserveFeeInfos?.first?.tokenB.name].compactMap { $0 }
        
        let nextStr = next?.description
        
        if path.count == 3 {
            return "\(path.joined())" + ((nextStr != nil) ? "-> \(nextStr!)" : "")
        }
        
        return nextStr ?? ""
    }
}
