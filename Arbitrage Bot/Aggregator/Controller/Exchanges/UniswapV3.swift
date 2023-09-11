////
////  UniswapV3.swift
////  Arbitrage Bot
////
////  Created by Arthur Guiot on 01/08/2023.
////
//
//import Foundation
//import Euler
//
//final class UniswapV3: Exchange {
//    var delegate: UniswapV3Router
//
//    typealias Delegate = UniswapV3Router
//
//    typealias Meta = UniswapV2.RequiredPriceInfo
//
//    var name: String {
//        ExchangesList.shared[keyPath: self.path].name
//    }
//
//    var path: KeyPath<ExchangesList, ExchangeMetadata>!
//
//    var type: ExchangeType
//
//    var trigger: PriceDataSubscriptionType
//
//    var fee: Euler.BigInt = 0.0
//
//    var coordinator: EthereumAddress?
//
//    var intermediaryStepData: EthereumAddress? {
//        self.delegate.address
//    }
//
//    // MARK: - Modelling
//    enum UniswapV3Fee: Int {
//        case LOWEST = 100
//        case LOW = 500
//        case MEDIUM = 3000
//        case HIGH = 1000
//    }
//
//    // MARK: - Error
//    enum UniswapV3Error: LocalizedError {
//        case identicalAddresses
//        case zeroAddress
//        case pairForEncodeIssue
//        case getReserveIssue(EthereumAddress)
//        case insufficientInputAmount
//        case insufficientLiquidity
//
//        var errorDescription: String? {
//            switch self {
//            case .identicalAddresses:
//                return "Token addresses must be different."
//            case .zeroAddress:
//                return "Token address must not be the zero address."
//            case .pairForEncodeIssue:
//                return "Encountered a problem while computing the pair address"
//            case .getReserveIssue(let address):
//                return "Encountered a problem while fetching the reserves for pair \(address.hex(eip55: false))"
//            case .insufficientInputAmount:
//                return "Insufficient input amount"
//            case .insufficientLiquidity:
//                return "Insufficient liquidity"
//            }
//        }
//    }
//
//    var wethAddress: EthereumAddress
//
//    func normalizeToken(token: Token) -> Token {
//        if token.address == .zero {
//            return Token(name: "WETH", address: wethAddress)
//        }
//        return token
//    }
//
//    func sortTokens(tokenA: EthereumAddress, tokenB: EthereumAddress) throws -> (EthereumAddress, EthereumAddress) {
//        if tokenA == tokenB {
//            throw UniswapV3Error.identicalAddresses
//        }
//        let (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA)
//        if token0 == .zero {
//            throw UniswapV3Error.zeroAddress
//        }
//        return (token0, token1)
//    }
//
//    func pairFor(factory: EthereumAddress, tokenA: EthereumAddress, tokenB: EthereumAddress, fee: UniswapV3Fee) throws -> EthereumAddress {
//        let (token0, token1) = try sortTokens(tokenA: tokenA, tokenB: tokenB)
//        guard let initCodeHash = UniswapV3PairHash[UniType(rawValue: self.name) ?? .uniswap] else { // UniswapV2 Pair init code hash
//            throw UniswapV3Error.pairForEncodeIssue
//        }
//
//        var concat = token0.rawAddress
//        concat.append(contentsOf: token1.rawAddress)
//        let hex = try ABIEncoder.encode(BigUInt(fee.rawValue), to: .uint24)
//        concat.append(contentsOf: hex.hexToBytes())
//
//        let salt = concat.sha3(.keccak256)
//
//        let create2 = try EthereumUtils.getCreate2Address(from: factory, salt: salt, initCodeHash: initCodeHash)
//
//        return create2
//    }
//
//    func getAmountOut(amountIn: Euler.BigInt, tokenA: Token, tokenB: Token, meta: UniswapV2.RequiredPriceInfo) throws -> Euler.BigInt {
//        <#code#>
//    }
//
//    func getQuote(maxAvailableAmount: Euler.BigInt?, tokenA: Token, tokenB: Token, maximizeB: Bool, meta: UniswapV2.RequiredPriceInfo?) async throws -> (Quote, UniswapV2.RequiredPriceInfo) {
//        <#code#>
//    }
//
//    func computeInputForMaximizingTrade(truePriceTokenA: Euler.BigInt, truePriceTokenB: Euler.BigInt, meta: UniswapV2.RequiredPriceInfo) -> Euler.BigInt {
//        <#code#>
//    }
//
//    func estimateTransactionTime(tokenA: Token, tokenB: Token) async throws -> Int {
//        fatalError("Method not implemented")
//    }
//
//    func estimateTransactionCost(amountIn: Double, price: Double, tokenA: Token, tokenB: Token, direction: String) async throws -> Cost {
//        fatalError("Method not implemented")
//    }
//
//    func buyAtMaximumOutput(amountIn: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
//        fatalError("Method not implemented")
//    }
//
//    func buyAtMinimumInput(amountOut: Double, path: [Token], to: String, deadline: Int, nonce: Int?) async throws -> Receipt {
//        fatalError("Method not implemented")
//    }
//
//    func balanceFor(token: Token) async throws -> Double {
//        fatalError("Method not implemented")
//    }
//}
