//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import BigInt

extension AdjacencyList {
    // Helper function to calculate the effective exchange rate
    func effectiveExchangeRate(amount: BigUInt, reserve0: BigUInt, reserve1: BigUInt, fee: BigUInt) -> BigUInt {
        let amountAfterFee = amount * (1 - fee)
        return amountAfterFee * reserve1 / (reserve0 + amountAfterFee)
    }
    
//    func findArbitrageCycles(initialAmount: BigUInt) -> [[Int]] {
//        let numTickers = self.table.count
//        var distances = Array<BigUInt?>(repeating: nil, count: numTickers)
//        var tradeHistory = Array(repeating: [Int](), count: numTickers)
//        var cycles: [[Int]] = []
//        
//        // Initialize the source vertex with distance 0
//        distances.append(0)
//        tradeHistory.append([])
//        
//        // Relax edges for N iterations
//        for _ in 0..<numTickers {
//            for ticker1 in 0..<numTickers {
//                guard let ticker1Edges = self.table[ticker1] else { continue }
//                for (ticker2, reserveFeeInfo) in ticker1Edges {
//                    let amount = distances[ticker1] ?? initialAmount
//                    let effectiveRate = effectiveExchangeRate(
//                        amount: amount,
//                        reserve0: reserveFeeInfo.reserve0,
//                        reserve1: reserveFeeInfo.reserve1,
//                        fee: reserveFeeInfo.fee
//                    )
//                    let newAmount = amount * effectiveRate
//                    if newAmount > (distances[ticker2] ?? 0) {
//                        distances[ticker2] = newAmount
//                        tradeHistory[ticker2] = tradeHistory[ticker1] + [ticker1]
//                    }
//                }
//            }
//        }
//        
//        // Check for negative cycles
//        for ticker1 in 0..<numTickers {
//            guard let ticker1Edges = self.table[ticker1] else { continue }
//            for (ticker2, reserveFeeInfo) in ticker1Edges {
//                let amount = distances[ticker1] ?? initialAmount
//                let effectiveRate = effectiveExchangeRate(
//                    amount: amount,
//                    reserve0: reserveFeeInfo.reserve0,
//                    reserve1: reserveFeeInfo.reserve1,
//                    fee: reserveFeeInfo.fee
//                )
//                let newAmount = amount * effectiveRate
//                if newAmount > (distances[ticker2] ?? 0) {
//                    var cycle = tradeHistory[ticker1] + [ticker1, ticker2]
//                    cycle = Array(Set(cycle)).sorted() // Remove duplicates and sort the cycle
//                    cycles.append(cycle)
//                }
//            }
//        }
//        
//        return cycles
//    }
}
