//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation

actor AdjacencyList {
    internal var table: [Int: [Int: ReserveFeeInfo<Any>]]
    internal var ids = [Int]()
    
    init() {
        table = [:]
    }
    
    func insert(tokenA: Token, tokenB: Token, info: ReserveFeeInfo<Any>) {
        self.insertReserveFee(ticker1: tokenA.hashValue, ticker2: tokenB.hashValue, info: info)
    }
    
    internal func insertReserveFee(ticker1: Int, ticker2: Int, info: ReserveFeeInfo<Any>) {
        if table[ticker1] == nil {
            table[ticker1] = [:]
        }
        table[ticker1]?[ticker2] = info
    }
    
    internal func addExchange(exchange: AnyExchange) {
        let id = exchange.hashValue
        guard idFor(exchange: id) == nil else { return }
        self.ids.append(id)
    }
    
    func idFor(exchange: Int) -> Int? {
        return self.ids.firstIndex { $0 == exchange }
    }
    
    func getReserveFee(ticker1: Int, ticker2: Int, exchangeID: Int) -> ReserveFeeInfo<Any>? {
        guard let tickerInfo = table[ticker1]?[ticker2], tickerInfo.exchange.hashValue == exchangeID else {
            return nil
        }
        return tickerInfo
    }
}
