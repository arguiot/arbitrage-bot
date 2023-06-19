//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import BigInt

struct Cost {
    var gas: BigInt?
    var costInDollars: Double
}

struct Token {
    var name: String
    var address: String
    var decimals: Int?
}

struct Receipt {
    var transactionHash: String?
    var amountIn: Double
    var amountOut: Double
    var price: Double
    var exchanges: [String]
    var path: [Token]
}

protocol Exchange {
    var name: String { get }
    var type: String { get } // "dex" or "cex"
    var fee: Double { get }
    
    // Properties
    associatedtype T
    associatedtype U
    var delegate: T { get set }
    
    // Methods
    func getQuote(maxAvailableAmount: Double, tokenA: Token, tokenB: Token, maximizeB: Bool, meta: U?) async throws -> Quote<U> // Returns the best quote for the maximum given amount of tokenA
    func estimateTransactionTime(tokenA: Token, tokenB: Token) async throws -> Int // Returns the estimated time to execute a transaction
    func estimateTransactionCost(amountIn: Double, price: Double, tokenA: Token, tokenB: Token, direction: String) async throws -> Cost // Returns the estimated cost to execute a transaction in dollars
    
    /// Buy with fixed input
    func buyAtMaximumOutput(amountIn: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt // Buys an exact amount of tokens for another token
    
    /// Buy with fixed output
    func buyAtMinimumInput(amountOut: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt // Buys an exact amount of tokens for another token
    
    // Liquidity methods
    func balanceFor(token: Token) async throws -> Double // Returns the liquidity for the given token
}

