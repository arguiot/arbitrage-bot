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
    
    let tokenA: Token
    let tokenB: Token
    
    init(tokenA: Token, tokenB: Token, adjacencyList: AdjacencyList) async {
        self.tokenA = tokenA
        self.tokenB = tokenB
        self.reserveFeeInfos = await adjacencyList
            .getReserves(tokenA: tokenA, tokenB: tokenB)
    }
    
    init(tokenA: Token? = nil, tokenB: Token? = nil, reserveFeeInfos: [ReserveFeeInfo]) {
        self.tokenA = tokenA ?? reserveFeeInfos.first!.tokenA
        self.tokenB = tokenB ?? reserveFeeInfos.first!.tokenB
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
            (try info.fastQuote(with: amount, tokenA: tokenA, tokenB: tokenB), info)
        })
            .reduce((0, reserveFeeInfos[0]), { max($0.0, $1.0) == $0.0 ? $0 : $1 })
        
        var chain = chain
        if let coordinator = info.exchange.coordinator,
           let intermediaryStepData = info.exchange.intermediaryStepData {
            let step = Step(intermediary: coordinator,
                            token: tokenA.address,
                            data: intermediaryStepData)
            chain.append(step)
            if next == nil {
                let step = Step(intermediary: coordinator,
                                token: tokenB.address,
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
        var path = [tokenA.name,
                    " -> ",
                    tokenB.name].compactMap { $0 }
        
        if let meta = reserveFeeInfos?[0].meta as? UniswapV2.RequiredPriceInfo {
            path.insert("(\((tokenA > tokenB ? meta.reserveA : meta.reserveB) / 1e18))", at: 1)
            path.insert("(\((tokenA > tokenB ? meta.reserveB : meta.reserveA) / 1e18))", at: 4)
        }
        
        let nextStr = next?.description
        
        if path.count == 3 || path.count == 5 {
            return "\(path.joined())" + ((nextStr != nil) ? "-> \(nextStr!)" : "")
        }
        
        return nextStr ?? ""
    }
}
