//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

struct Quote<U> {
    var exchangeType: String
    var exchangeName: String
    var amount: Double // Amount of tokenA
    var amountOut: Double // Amount of tokenB
    var price: Double // Average price
    var transactionPrice: Double // The price at which we would buy/sell
    var tokenA: Token
    var tokenB: Token
    var ask: Double?
    var bid: Double?
    var ttf: Double?
    var meta: U?
}
