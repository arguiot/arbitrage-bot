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

public struct Token: Codable, Hashable, Sendable, Identifiable {
    var name: String
    var address: EthereumAddress
    var decimals: Int?
    
    public var id: Int {
        return address.hashValue
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

class Exchange<Delegate, Meta>: Hashable {
    static func == (lhs: Exchange<Delegate, Meta>, rhs: Exchange<Delegate, Meta>) -> Bool {
        guard lhs.untyped.hashValue == rhs.untyped.hashValue else { return false }
        return true
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(untyped.hashValue)
    }
    
    var type: ExchangeType = .dex // "dex" or "cex"
    var trigger: PriceDataSubscriptionType = .ethereumBlock
    var fee: Euler.BigInt { .zero }
    
    var delegate: Delegate
    
    internal init(delegate: Delegate) {
        self.delegate = delegate
    }
    // Methods
    
    /// Returns the best quote for the maximum given amount of tokenA
    func getQuote(maxAvailableAmount: Euler.BigInt?, tokenA: Token, tokenB: Token, maximizeB: Bool, meta: Meta?) async throws -> (Quote, Meta) {
        fatalError("Not implemented");
    }
    /// Returns the estimated time to execute a transaction
    func estimateTransactionTime(tokenA: Token, tokenB: Token) async throws -> Int {
        fatalError("Not implemented");
    }
    
    /// Returns the estimated cost to execute a transaction in dollars
    func estimateTransactionCost(amountIn: Double, price: Double, tokenA: Token, tokenB: Token, direction: String) async throws -> Cost {
        fatalError("Not implemented");
    }
    
    /// Buy with fixed input
    /// Buys an exact amount of tokens for another token
    func buyAtMaximumOutput(amountIn: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
        fatalError("Not implemented");
    }
    
    /// Buy with fixed output
    /// Buys an exact amount of tokens for another token
    func buyAtMinimumInput(amountOut: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
        fatalError("Not implemented");
    }
    
    // Balance methods
    /// Returns the liquidity for the given token
    func balanceFor(token: Token) async throws -> Double {
        fatalError("Not implemented");
    }
    
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
    ) -> Euler.BigInt {
        fatalError("Not implemented");
    }
}

extension Exchange {
    func meanPrice(tokenA: Token, tokenB: Token) async throws -> Quote {
        let (quote, meta) = try await self.getQuote(maxAvailableAmount: nil, tokenA: tokenA, tokenB: tokenB, maximizeB: true, meta: nil)
        
        // Store in PriceDataStore
        if let store = PriceDataStoreWrapper.shared {
            let reserveFee = ReserveFeeInfo<Meta>(exchange: self.untyped, meta: meta, spot: quote.transactionPrice, fee: self.fee)
            await store.adjacencyList.insert(tokenA: tokenA, tokenB: tokenB, info: reserveFee as! ReserveFeeInfo<Any>)
        }
        
        return quote
    }
    
    var untyped: AnyExchange {
        return AnyExchange(self)
    }
}
