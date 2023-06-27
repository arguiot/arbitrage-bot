//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation

actor AdjacencyList {
    internal var table: [Token: [Token: Set<ReserveFeeInfo<Any>>]]
    internal var ids = [Int]()
    
    init() {
        table = [:]
    }
    
    func insert(tokenA: Token, tokenB: Token, info: ReserveFeeInfo<Any>) {
        if table[tokenA] == nil {
            table[tokenA] = [:]
        }
        if table[tokenA]![tokenB] == nil {
            table[tokenA]![tokenB] = Set(arrayLiteral: info)
            return
        }
        table[tokenA]![tokenB]!.insert(info)
    }
}
