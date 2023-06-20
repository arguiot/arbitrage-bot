//
//  File.swift
//  
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
import BigInt
import Web3
import Web3PromiseKit
import Vapor
import Euler

struct RequiredPriceInfo {
    let routerAddress: EthereumAddress;
    let factoryAddress: EthereumAddress;
    let reserveA: BigUInt;
    let reserveB: BigUInt;
}

class UniswapV2: Exchange {
    var name: UniType = .uniswap
    
    var type: ExchangeType = .dex
    
    var fee: Double {
        if name == .apeswap {
            return 0.003;
        } else if name == .pancakeswap {
            return 0.0025;
        }
        return 0.003;
    }
    
    var delegate: UniswapV2Router
    var factory: EthereumAddress
    
    init(delegate: UniswapV2Router, factory: EthereumAddress) {
        self.delegate = delegate
        self.factory = factory
        
        let wethAddressEnv = Environment.get("WETH_CONTRACT_ADDRESS")
        ?? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        
        self.wethAddress = try! EthereumAddress(hex: wethAddressEnv, eip55: false)
    }
    
    // MARK: - Error
    enum UniswapV2Error: LocalizedError {
        case identicalAddresses
        case zeroAddress
        case pairForEncodeIssue
        case getReserveIssue(EthereumAddress)
        case insufficientInputAmount
        case insufficientLiquidity
        
        var errorDescription: String? {
            switch self {
            case .identicalAddresses:
                return "Token addresses must be different."
            case .zeroAddress:
                return "Token address must not be the zero address."
            case .pairForEncodeIssue:
                return "Encountered a problem while computing the pair address"
            case .getReserveIssue(let address):
                return "Encountered a problem while fetching the reserves for pair \(address.hex(eip55: false))"
            case .insufficientInputAmount:
                return "Insufficient input amount"
            case .insufficientLiquidity:
                return "Insufficient liquidity"
            }
        }
    }
    
    // MARK: - Contract Methods
    var wethAddress: EthereumAddress
    
    func normalizeToken(token: Token) -> Token {
        if token.address == .zero {
            return Token(name: "WETH", address: wethAddress)
        }
        return token
    }
    
    func sortTokens(tokenA: EthereumAddress, tokenB: EthereumAddress) throws -> (EthereumAddress, EthereumAddress) {
        if tokenA == tokenB {
            throw UniswapV2Error.identicalAddresses
        }
        let (token0, token1) = tokenA.hex(eip55: false).lowercased() < tokenB.hex(eip55: false).lowercased() ? (tokenA, tokenB) : (tokenB, tokenA)
        if token0 == .zero {
            throw UniswapV2Error.zeroAddress
        }
        return (token0, token1)
    }
    
    func pairFor(factory: EthereumAddress, tokenA: EthereumAddress, tokenB: EthereumAddress) throws -> EthereumAddress {
        let (token0, token1) = try sortTokens(tokenA: tokenA, tokenB: tokenB)
        guard let initCodeHash = UniswapV2PairHash[self.name] else { // UniswapV2 Pair init code hash
            throw UniswapV2Error.pairForEncodeIssue
        }
        
        var concat = token0.rawAddress
        concat.append(contentsOf: token1.rawAddress)
        
        let salt = concat.sha3(.keccak256)
        
        let create2 = try EthereumUtils.getCreate2Address(from: factory, salt: salt, initCodeHash: initCodeHash)
        
        return create2
    }

    func getReserves(
        factory: EthereumAddress,
        tokenA: EthereumAddress,
        tokenB: EthereumAddress
    ) async throws -> (BigUInt, BigUInt) {
        let computedPair = try pairFor(factory: factory, tokenA: tokenA, tokenB: tokenB)
        let pair = Credentials.shared.web3.eth.Contract(type: UniswapV2Pair.self, address: computedPair)
        let invocation = try await pair.getReserves().call().async()
        guard let reserve0 = invocation["reserve0"] as? BigUInt else {
            throw UniswapV2Error.getReserveIssue(computedPair)
        }
        guard  let reserve1 = invocation["reserve1"] as? BigUInt else {
            throw UniswapV2Error.getReserveIssue(computedPair)
        }
        
        let (token0, _) = try sortTokens(tokenA: tokenA, tokenB: tokenB)
        
        return tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }
    
    func getAmountOut(
        amountIn: BigUInt,
        reserveIn: BigUInt,
        reserveOut: BigUInt
    ) throws -> BigUInt {
        guard amountIn > 0 else { throw UniswapV2Error.insufficientInputAmount }
        guard reserveIn > 0 && reserveOut > 0 else { throw UniswapV2Error.insufficientLiquidity }
        let amountInWithFee = amountIn * BigUInt(1_000 - Int(fee * 1_000))
        let numerator = amountInWithFee * reserveOut
        let denominator = reserveIn * BigUInt(1_000) + amountInWithFee
        return numerator / denominator
    }
    
    func getAmountIn(
        amountOut: BigUInt,
        reserveIn: BigUInt,
        reserveOut: BigUInt
    ) throws -> BigUInt {
        guard amountOut > 0 else { throw UniswapV2Error.insufficientInputAmount }
        guard reserveIn > 0 && reserveOut > 0 else { throw UniswapV2Error.insufficientLiquidity }
        let numerator = reserveIn * amountOut * BigUInt(1_000)
        let denominator = (reserveOut - amountOut) * BigUInt(1_000 - Int(fee * 1_000))
        return (numerator / denominator) + 1
    }

    // MARK: - Methods
    
    func getQuote(maxAvailableAmount: BigUInt, tokenA: Token, tokenB: Token, maximizeB: Bool, meta: RequiredPriceInfo?) async throws -> Quote<RequiredPriceInfo> {
        let tokenA = normalizeToken(token: tokenA)
        let tokenB = normalizeToken(token: tokenB)

        var reserveA: BigUInt;
        var reserveB: BigUInt;
        if let meta = meta {
            reserveA = meta.reserveA
            reserveB = meta.reserveB
        } else {
            (reserveA, reserveB) = try await getReserves(factory: self.factory, tokenA: tokenA.address, tokenB: tokenB.address)
        }
        
        let _quoteOut = maximizeB
        ? try self.getAmountOut(amountIn: maxAvailableAmount, reserveIn: reserveA, reserveOut: reserveB)
        : try self.getAmountIn(amountOut: maxAvailableAmount, reserveIn: reserveB, reserveOut: reserveA)
        
        let meta = RequiredPriceInfo(
            routerAddress: self.delegate.address!,
            factoryAddress: self.factory,
            reserveA: reserveA,
            reserveB: reserveB
        )
        
        let biRN = Euler.BigInt(sign: false, words: reserveA.words.map { $0 })
        let biRD = Euler.BigInt(sign: false, words: reserveB.words.map { $0 })
        
        let price = BigDouble(biRD, over: biRN)
        
        let biTN = Euler.BigInt(sign: false, words: _quoteOut.words.map { $0 })
        let biTD = Euler.BigInt(sign: false, words: maxAvailableAmount.words.map { $0 })
        
        let transactionPrice = BigDouble(biTN, over: biTD)
        
        let quote = Quote(
            exchangeType: Self.self,
            exchangeName: self.name.rawValue,
            amount: maxAvailableAmount,
            amountOut: _quoteOut,
            price: price,
            transactionPrice: transactionPrice,
            tokenA: tokenA,
            tokenB: tokenB,
            ttf: nil,
            meta: meta
        )
        
        return quote
    }
    
    func estimateTransactionTime(tokenA: Token, tokenB: Token) async throws -> Int {
        fatalError("Method not implemented")
    }
    
    func estimateTransactionCost(amountIn: Double, price: Double, tokenA: Token, tokenB: Token, direction: String) async throws -> Cost {
        fatalError("Method not implemented")
    }
    
    func buyAtMaximumOutput(amountIn: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
        fatalError("Method not implemented")
    }
    
    func buyAtMinimumInput(amountOut: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
        fatalError("Method not implemented")
    }
    
    func balanceFor(token: Token) async throws -> Double {
        fatalError("Method not implemented")
    }
    
    typealias T = UniswapV2Router
    
    typealias U = RequiredPriceInfo
}
