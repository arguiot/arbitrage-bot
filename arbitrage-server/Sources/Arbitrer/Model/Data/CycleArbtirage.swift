//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import Euler
import CollectionConcurrencyKit

extension AdjacencyList {
    struct PriceDataFrame {
        var rates: [[Euler.BigInt]]
        var columns: [Token]
        var size: Int {
            return columns.count
        }
    }
    
    // Helper function to calculate the effective exchange rate
    func effectiveExchangeRate(amount: BigInt, reserveFeeInfo: Set<ReserveFeeInfo<Any>>, tokenA: Token, tokenB: Token) async -> BigInt {
        var newAmount = BigInt(0)
        let maxAvailableAmount = amount
        
        for reserveFeeInfoData in reserveFeeInfo {
            async let quote: BigInt = {
                let quoteAmountOut = try await reserveFeeInfoData
                    .exchange
                    .getQuote(maxAvailableAmount: maxAvailableAmount,
                              tokenA: tokenA,
                              tokenB: tokenB,
                              maximizeB: true,
                              meta: reserveFeeInfoData.meta).0.amountOut
                return quoteAmountOut
            }()
            let result = try? await quote
            newAmount = max(newAmount, result ?? 0)
        }
        return newAmount
    }
    
    func findArbitrage(tokens: [Token]) async -> [[Token]] {
        let size = self.table.count
        let sourceIndex = 0
        var edges = Array(repeating: BN.zero, count: size)
        
        // The ﻿predecessor array is used to keep track of the shortest path
        // found so far for each node from a source node in the graph.
        // It stores the immediate predecessor (parent) of each node in the
        // shortest path tree.
        //
        // For example, assume we find a new shorter path from the source node
        // to node ﻿k through node ﻿j. In this case, the ﻿predecessor array will
        // be updated to reflect the new parent of node ﻿k by setting ﻿predecessor[k] = j.
        // By tracing back the nodes in the ﻿predecessor array, we can reconstruct
        // the full shortest path from the source node to any other node in the graph.
        var predecessor = Array(repeating: -1, count: size)
        
        var rates = Array(repeating: Array(repeating: BN.zero, count: size), count: size)
        
        edges[sourceIndex] = 0
 
        // Perform the relaxation steps (Bellman-Ford algorithm)
        // This algorithm will iteratively relax all edges to find shortest paths
        // in the graph. After each iteration, shorter paths are discovered from
        // the source node to all other nodes. It will perform V-1 iterations, where
        // V is the number of vertices (size) in the graph.
        for _ in 0..<(size - 1) {
            for j in 0..<size {
                for k in 0..<size {
                    let tokenJ = tokens[j]
                    let tokenK = tokens[k]
                    guard let reserveFeeInfos = self.table[tokenJ]?[tokenK] else { continue }
                    
                    let seqRates = try? await reserveFeeInfos
                        .concurrentMap { reserveFeeInfo in
                            var amount: BigInt? = nil
                            if edges[k] > BN.zero {
                                let truePriceOfTokenB = 1.eth.euler * edges[k]
                                
                                amount = reserveFeeInfo
                                    .exchange
                                    .computeInputForMaximizingTrade(truePriceTokenA: 1.eth.euler,
                                                                    truePriceTokenB: truePriceOfTokenB.rounded(),
                                                                    meta: reserveFeeInfo.meta)
                            }
                            return try await reserveFeeInfo.calculatedQuote(with: amount, tokenA: tokenJ, tokenB: tokenK)
                        }
                    let bestPrice = seqRates?.reduce(BN.zero) { max($0, $1.amountOut > 0 ? BN($1.amountOut) / $1.amount : $1.transactionPrice) }
                    guard let bestPrice = bestPrice else { continue }
                    let rate = -ln(bestPrice)
                    rates[j][k] = rate
                    if edges[k] > edges[j] + rate {
                        edges[k] = edges[j] + rate
                        predecessor[k] = j
                    }
                }
            }
        }
        
        var arbitrages: [[Token]] = []
        
        var i = 0;
        while (i < size) {
            // After V-1 iterations, any negative cycle in the graph (arbitrage opportunity)
            // will still contain shorter (less cost) paths, indicating its presence.
            let currentI = i
            for j in 0..<size {
                if edges[j] > edges[i] + rates[i][j] {
                    //
                    // A negative cycle is found. Now, we need to backtrack from this node
                    // using the predecessor array and record the token cycle order,
                    // represented by their indices.
                    var arbitrageOrder: [Int] = [] // Store found indices in dynamic array
                    
                    arbitrageOrder.append(j)
                    arbitrageOrder.append(i)
                    
                    while (!arbitrageOrder.contains { $0 == predecessor[i] }) {
                        arbitrageOrder.append(predecessor[i])
                        i = predecessor[i]
                    }
                    
                    arbitrageOrder.append(predecessor[i])
                    
                    // Reverse and filter out invalid token indices, then store the arbitrage cycle
                    // in the "arbitrages" array.
                    let tokens = arbitrageOrder.reversed().filter { $0 != -1 }.map { tokens[$0] }
                    arbitrages.append(tokens)
                }
            }
            i = currentI + 1;
        }
        
        func negateLogRates(rates: [[Double]], size: Int) -> [[Double]] {
            var newRates = rates.map { Array(repeating: 0.0, count: $0.count) }
            for i in 0..<size {
                for j in 0..<size {
                    newRates[i][j] = -log(rates[i][j])
                }
            }
            return newRates
        }
        
        return arbitrages
    }
}
