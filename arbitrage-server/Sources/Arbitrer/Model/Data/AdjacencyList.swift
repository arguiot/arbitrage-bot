//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
class AdjacencyList {
    internal var table: [Int: [Int: ReserveFeeInfo]]
    
    init() {
        table = [:]
    }
    
    func insert(tokenA: Token, tokenB: Token, info: ReserveFeeInfo) {
        self.insertReserveFee(ticker1: tokenA.hashValue, ticker2: tokenB.hashValue, info: info)
    }
    
    internal func insertReserveFee(ticker1: Int, ticker2: Int, info: ReserveFeeInfo) {
        if table[ticker1] == nil {
            table[ticker1] = [:]
        }
        table[ticker1]?[ticker2] = info
    }
    
    func getReserveFee(ticker1: Int, ticker2: Int, exchangeID: Int) -> ReserveFeeInfo? {
        guard let tickerInfo = table[ticker1]?[ticker2], tickerInfo.exchangeID == exchangeID else {
            return nil
        }
        return tickerInfo
    }
}
