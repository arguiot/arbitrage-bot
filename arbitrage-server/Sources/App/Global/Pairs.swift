//
//  Pairs.swift
//
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
import Web3

enum TokenSymbol: String {
    case eth = "ETH"
    case usdt = "USDT"
    case wethBsctestnet = "WETH_BSCTESTNET"
    case usdtBsctestnet = "USDT_BSCTESTNET"
    case tkaBsctestnet = "TKA_BSCTESTNET"
    case tkbBsctestnet = "TKB_BSCTESTNET"
    case usdc = "USDC"
    case btc = "BTC"
    case aave = "AAVE"
}

struct PairInfo: Codable {
    let tokenA: Token
    let tokenB: Token
}

struct PairListType: Codable {
    let development: [String: PairInfo]
    let production: [String: PairInfo]
}

let TokenList: [TokenSymbol: Token] = [
    .eth: Token(
        name: "Ethereum", address: .zero
    ),
    .usdt: Token(
        name: "Tether", address: try! EthereumAddress(hex: "0xdac17f958d2ee523a2206206994597c13d831ec7", eip55: false)
    ),
    .wethBsctestnet: Token(
        name: "ETH", address: try! EthereumAddress(hex: "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F", eip55: false)
    ),
    .usdtBsctestnet: Token(
        name: "USDT", address: try! EthereumAddress(hex: "0x0a1B8D7450F69d33803e8b084aBA9d2F858f6574", eip55: false)
    ),
    .tkaBsctestnet: Token(
        name: "TKA", address: try! EthereumAddress(hex: "0x9c36c0a6FFD4322c647572CACfc1d5C475c854CD", eip55: false)
    ),
    .tkbBsctestnet: Token(
        name: "TKB", address: try! EthereumAddress(hex: "0xBf8C59a713927773f9Bf1BCcE21269f7bd95BC6c", eip55: false)
    ),
    .usdc: Token(
        name: "USD Coin", address: try! EthereumAddress(hex: "0x3c3aA68bc795e72833218229b0e53eFB4143A152", eip55: false)
    ),
//    .btc: Token(
//        address: nil,
//        name: "Bitcoin"
//    ),
    .aave: Token(
        name: "Aave", address: try! EthereumAddress(hex: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", eip55: false)
    ),
]

let PairList: PairListType = PairListType(
    development: [
        "ETH/USDT": PairInfo(
            tokenA: TokenList[.wethBsctestnet]!,
            tokenB: TokenList[.usdtBsctestnet]!
        ),
        "TKA/TKB": PairInfo(
            tokenA: TokenList[.tkaBsctestnet]!,
            tokenB: TokenList[.tkbBsctestnet]!
        ),
        "ETH/TKA": PairInfo(
            tokenA: TokenList[.wethBsctestnet]!,
            tokenB: TokenList[.tkaBsctestnet]!
        ),
        "TKB/USDT": PairInfo(
            tokenA: TokenList[.tkbBsctestnet]!,
            tokenB: TokenList[.usdtBsctestnet]!
        ),
    ],
    production: [
        "ETH/USDT": PairInfo(
            tokenA: TokenList[.eth]!,
            tokenB: TokenList[.usdt]!
        ),
        "ETH/USDC": PairInfo(
            tokenA: TokenList[.eth]!,
            tokenB: TokenList[.usdc]!
        ),
        "ETH/BTC": PairInfo(
            tokenA: TokenList[.eth]!,
            tokenB: TokenList[.btc]!
        ),
        "AAVE/ETH": PairInfo(
            tokenA: TokenList[.aave]!,
            tokenB: TokenList[.eth]!
        ),
    ]
)
