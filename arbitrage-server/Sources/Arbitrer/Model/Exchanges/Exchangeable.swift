//
//  Exchangeable.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 26/06/2023.
//

import Foundation
import Euler

class AnyExchange: Exchange<Any, Any> {
    private let _getQuote: (BigInt?, Token, Token, Bool, Any?) async throws -> (Quote, Any)
    private let _estimateTransactionTime: (Token, Token) async throws -> Int
    private let _estimateTransactionCost: (Double, Double, Token, Token, String) async throws -> Cost
    private let _buyAtMaximumOutput: (Double, [Token], String, Int, Int?) async throws -> Receipt
    private let _buyAtMinimumInput: (Double, [Token], String, Int, Int?) async throws -> Receipt
    private let _balanceFor: (Token) async throws -> Double
    private let _computeInputForMaximizingTrade: (BigInt, BigInt, Any) -> BigInt
    
    init<T, U>(_ exchange: Exchange<T, U>) {
        _getQuote = {
            try await exchange.getQuote(maxAvailableAmount: $0, tokenA: $1, tokenB: $2, maximizeB: $3, meta: $4 as? U)
        }
        _estimateTransactionTime = exchange.estimateTransactionTime
        _estimateTransactionCost = exchange.estimateTransactionCost
        _buyAtMaximumOutput = exchange.buyAtMaximumOutput
        _buyAtMinimumInput = exchange.buyAtMinimumInput
        _balanceFor = exchange.balanceFor
        _computeInputForMaximizingTrade = {
            guard let meta = $2 as? U else { return .zero }
            return exchange.computeInputForMaximizingTrade(truePriceTokenA: $0, truePriceTokenB: $1, meta: meta)
        }
        super.init(delegate: exchange.delegate);
    }
    
    override func hash(into hasher: inout Hasher) {
        hasher.combine(ObjectIdentifier(self).hashValue)
    }

    static func == (lhs: AnyExchange, rhs: AnyExchange) -> Bool {
        return ObjectIdentifier(lhs) == ObjectIdentifier(rhs)
    }

    override func getQuote(maxAvailableAmount: BigInt?, tokenA: Token, tokenB: Token, maximizeB: Bool, meta: Any?) async throws -> (Quote, Any) {
        return try await _getQuote(maxAvailableAmount, tokenA, tokenB, maximizeB, meta)
    }
    
    override func estimateTransactionTime(tokenA: Token, tokenB: Token) async throws -> Int {
        return try await _estimateTransactionTime(tokenA, tokenB)
    }
    
    override func estimateTransactionCost(amountIn: Double, price: Double, tokenA: Token, tokenB: Token, direction: String) async throws -> Cost {
        return try await _estimateTransactionCost(amountIn, price, tokenA, tokenB, direction)
    }
    
    override func buyAtMaximumOutput(amountIn: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
        return try await _buyAtMaximumOutput(amountIn, path, to, deadline, nonce)
    }
    
    override func buyAtMinimumInput(amountOut: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
        return try await _buyAtMinimumInput(amountOut, path, to, deadline, nonce)
    }
    
    override func balanceFor(token: Token) async throws -> Double {
        return try await _balanceFor(token)
    }
    
    override func computeInputForMaximizingTrade(
        truePriceTokenA: BigInt,
        truePriceTokenB: BigInt,
        meta: Any
    ) -> BigInt {
        return _computeInputForMaximizingTrade(truePriceTokenA, truePriceTokenB, meta)
    }
}
