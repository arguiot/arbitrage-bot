//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation

actor AdjacencyList {
    struct Pair: Hashable {
        let tokenA: Token
        let tokenB: Token
        
        init(_ tokenA: Token, _ tokenB: Token) {
            self.tokenA = tokenA
            self.tokenB = tokenB
        }
    }
    internal var prices: [Int: [Int: ReserveFeeInfo]]
    internal var tokens: [Token]
    
    init() {
        prices = [:]
        tokens = []
    }
    
    func insert(tokenA: Token, tokenB: Token, info: ReserveFeeInfo) {
        let (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA)
        var queue = [token0, token1].filter { !self.tokens.contains($0) }
        var i = 0
        while !queue.isEmpty {
            if i >= self.tokens.count || queue[0] < self.tokens[i] {
                self.tokens.insert(queue[0], at: i)
                queue.removeFirst()
            }
            i += 1
        }
        guard let row: Int = tokens.firstIndex(of: token0) else { fatalError("Unexpected error while inserting") }
        guard let col: Int = tokens.firstIndex(of: token1) else { fatalError("Unexpected error while inserting") }
        
        let firstN = row * (row + 1) / 2
        let index = firstN + 1 + col
        
        if prices[index] == nil {
            prices[index] = [:]
        }
        
        var info = info
        
        if token0 != tokenA {
            info.swap = true
        }
        prices[index]?[info.exchangeKey.hashValue] = info
    }
    
    var spotPicture: [Double] {
        let size = tokens.count
        guard size > 0 else { return [] }
        
        var flattenConversionRates = Array(repeating: Double.infinity, count: size * size)
        
        func findRow(k: Int) -> Int {
            var sum = 0
            var row = 0
            
            while sum < k {
                row += 1
                sum += row
            }
            return row - 1 // 0-based index
        }
        
        for (index, exchanges) in prices {
            let (minSpot, maxSpot) = exchanges.values.reduce((.infinity, 0), { (min($0.0, $1.spot), max($0.1, $1.spot)) })
            
            let row = findRow(k: index)
            let col = index - row - 1
            
            let computedLowerIndex = row * size + col
            let computedUpperIndex = col * size + row
            
            flattenConversionRates[computedLowerIndex] = maxSpot
            flattenConversionRates[computedUpperIndex] = 1 / minSpot
        }
        
        for i in 0..<tokens.count {
            flattenConversionRates[(tokens.count + 1) * i] = 1
        }
        
        return flattenConversionRates
    }

}
