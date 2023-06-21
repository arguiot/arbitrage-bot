//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation
import BigInt
import Euler

public struct Quote<U>: Codable, Sendable where U: Codable & Sendable {
    var exchangeName: String
    var amount: BigUInt // Amount of tokenA
    var amountOut: BigUInt // Amount of tokenB
    var decimals = 18
    var price: BigDouble // Average price
    var transactionPrice: BigDouble // The price at which we would buy/sell
    var tokenA: Token
    var tokenB: Token
    var ask: Double?
    var bid: Double?
    var ttf: Double?
    var meta: U?
}

extension BigUInt: @unchecked Sendable {}
extension BigDouble: @unchecked Sendable {}
