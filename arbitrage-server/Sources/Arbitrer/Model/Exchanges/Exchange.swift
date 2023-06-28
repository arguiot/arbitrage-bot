//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Web3
import Euler

struct Cost {
    var gas: Euler.BigInt?
    var costInDollars: Double
}

public struct Token: Codable, Hashable, Sendable, Identifiable, Comparable {
    var name: String
    var address: EthereumAddress
    var decimals: Int?
    
    public var id: Int {
        return address.hashValue
    }
    
    public static func < (lhs: Token, rhs: Token) -> Bool {
        return lhs.address < rhs.address
    }
}

extension EthereumAddress: @unchecked Sendable {}

struct Receipt {
    var transactionHash: String?
    var amountIn: Euler.BigInt
    var amountOut: Euler.BigInt
    var price: Double
    var exchanges: [String]
    var path: [Token]
}

public enum ExchangeType: String, Codable {
    case dex, cex
}

struct ExchangeAdapter {
    static let uniswap = UniswapV2.self
}

protocol Exchange: Hashable {
    
    associatedtype Delegate
    associatedtype Meta
    
    var path: KeyPath<ExchangesList, ExchangeMetadata>! { get set }
    var type: ExchangeType { get }
    var trigger: PriceDataSubscriptionType { get }
    var fee: Euler.BigInt { get }
    
    var delegate: Delegate { get }
    
    // Methods
    
    /// Returns the best quote for the maximum given amount of tokenA
    func getQuote(maxAvailableAmount: Euler.BigInt?, tokenA: Token, tokenB: Token, maximizeB: Bool, meta: Meta?) async throws -> (Quote, Meta)
    
    /// Returns the estimated time to execute a transaction
    func estimateTransactionTime(tokenA: Token, tokenB: Token) async throws -> Int
    
    /// Returns the estimated cost to execute a transaction in dollars
    func estimateTransactionCost(amountIn: Double, price: Double, tokenA: Token, tokenB: Token, direction: String) async throws -> Cost
    
    /// Buy with fixed input
    /// Buys an exact amount of tokens for another token
    func buyAtMaximumOutput(amountIn: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt
    
    /// Buy with fixed output
    /// Buys an exact amount of tokens for another token
    func buyAtMinimumInput(amountOut: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt
    
    // Balance methods
    /// Returns the liquidity for the given token
    func balanceFor(token: Token) async throws -> Double
    
    // Math
    
    /// Compute the best input for two exchanges
    /// - Parameters:
    ///   - truePriceTokenA: price of token A on next exchange
    ///   - truePriceTokenB: price of token B on next exchange
    ///   - meta: Meta to calculate pice
    /// - Returns: Input
    func computeInputForMaximizingTrade(
        truePriceTokenA: Euler.BigInt,
        truePriceTokenB: Euler.BigInt,
        meta: Meta
    ) -> Euler.BigInt
    
    func meanPrice(tokenA: Token, tokenB: Token) async throws -> Quote
}

extension Exchange {
    static func == (lhs: any Exchange, rhs: any Exchange) -> Bool {
        guard lhs.hashValue == rhs.hashValue else { return false }
        return true
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(self.path.hashValue)
    }
    
    func meanPrice(tokenA: Token, tokenB: Token) async throws -> Quote {
        let (quote, meta) = try await self.getQuote(maxAvailableAmount: nil, tokenA: tokenA, tokenB: tokenB, maximizeB: true, meta: nil)
        
        // Store in PriceDataStore
        if let store = PriceDataStoreWrapper.shared {
            let key: PartialKeyPath = self.path.appending(path: \.exchange)
            
            let reserveFee = ReserveFeeInfo(exchangeKey: key as! KeyPath<ExchangesList, any Exchange>,
                                            meta: meta,
                                            spot: quote.transactionPrice.asDouble() ?? 0, fee: self.fee)
            await store.adjacencyList.insert(tokenA: tokenA, tokenB: tokenB, info: reserveFee)
        }
        
        return quote
    }

}
