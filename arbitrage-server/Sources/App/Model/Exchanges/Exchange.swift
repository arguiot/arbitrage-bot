//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import BigInt
import Web3

struct Cost {
    var gas: BigInt?
    var costInDollars: Double
}

struct Token: Codable, Hashable {
    var name: String
    var address: EthereumAddress
    var decimals: Int?
}

struct Receipt {
    var transactionHash: String?
    var amountIn: BigUInt
    var amountOut: BigUInt
    var price: Double
    var exchanges: [String]
    var path: [Token]
}

enum ExchangeType: String, Codable {
    case dex, cex
}

struct ExchangeAdapter {
    static let uniswap = UniswapV2.self
}

protocol Exchange: Hashable {
    var type: ExchangeType { get } // "dex" or "cex"
    nonisolated var fee: Double { get }
    
    // Properties
    associatedtype Delegate
    associatedtype Meta
    var delegate: Delegate { get }
    // Methods
    func getQuote(maxAvailableAmount: BigUInt, tokenA: Token, tokenB: Token, maximizeB: Bool, meta: Meta?) async throws -> Quote<Meta> // Returns the best quote for the maximum given amount of tokenA
    func estimateTransactionTime(tokenA: Token, tokenB: Token) async throws -> Int // Returns the estimated time to execute a transaction
    func estimateTransactionCost(amountIn: Double, price: Double, tokenA: Token, tokenB: Token, direction: String) async throws -> Cost // Returns the estimated cost to execute a transaction in dollars
    
    /// Buy with fixed input
    func buyAtMaximumOutput(amountIn: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt // Buys an exact amount of tokens for another token
    
    /// Buy with fixed output
    func buyAtMinimumInput(amountOut: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt // Buys an exact amount of tokens for another token
    
    // Liquidity methods
    func balanceFor(token: Token) async throws -> Double // Returns the liquidity for the given token
}

