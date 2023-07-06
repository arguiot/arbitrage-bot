//
//  Token.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 29/06/2023.
//

import Foundation

public struct Token: Codable, Hashable, Sendable, Identifiable, Comparable, CustomStringConvertible {
    var name: String
    var address: EthereumAddress
    var decimals: Int?
    
    public var id: Int {
        return address.hashValue
    }
    
    public static func < (lhs: Token, rhs: Token) -> Bool {
        return lhs.address < rhs.address
    }
    
    public var description: String {
        return name
    }
    
    static internal func fake(id: Int) -> Token {
        return Token(name: "TK\(id)", address: .init(id))
    }
}