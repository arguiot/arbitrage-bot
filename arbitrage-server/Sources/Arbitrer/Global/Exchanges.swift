//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation
import Web3

struct ExchangeInfo: Codable {
    let name: String
    let type: String
    var adapter: String? = nil
    var routerAddress: EthereumAddress? = nil
    var factoryAddress: EthereumAddress? = nil
    var coordinatorAddress: EthereumAddress? = nil
    var testnet: Bool? = nil
}

typealias IExchangesList = [
    BotRequest.Environment: [String: any Exchange]
]

let ExchangesList: IExchangesList = [
    .development: [
        "uniswap": UniswapV2(
            name: .uniswap,
            router: try! EthereumAddress(hex: "0xF76921660f6fcDb161A59c77d5daE6Be5ae89D20", eip55: false),
            factory: try! EthereumAddress(hex: "0xADf1687e201d1DCb466D902F350499D008811e84", eip55: false),
            coordinator: try! EthereumAddress(hex: "0x6db4fa64f67AADc606deFAFA8106E83113d2f730", eip55: false)
        ),
        "pancakeswap": UniswapV2(
            name: .pancakeswap,
            router: try! EthereumAddress(hex: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1", eip55: false),
            factory: try! EthereumAddress(hex: "0x6725F303b657a9451d8BA641348b6761A6CC7a17", eip55: false),
            coordinator: try! EthereumAddress(hex: "0x6db4fa64f67AADc606deFAFA8106E83113d2f730", eip55: false)
        ),
        "apeswap": UniswapV2(
            name: .apeswap,
            router: try! EthereumAddress(hex: "0x1c6f40e550421D4307f9D5a878a1628c50be0C5B", eip55: false),
            factory: try! EthereumAddress(hex: "0x5722F3b02b9fe2003b3045D73E9230684707B257", eip55: false),
            coordinator: try! EthereumAddress(hex: "0x6db4fa64f67AADc606deFAFA8106E83113d2f730", eip55: false)
        ),
    ],
    .production: [:]
]

// MARK: - Uniswap V2 Constants
let UniswapV2PairHash: [UniType: [UInt8]] = [
    .apeswap: Array<UInt8>(hex: "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"),
    .pancakeswap: Array<UInt8>(hex: "0xd0d4c4cd0848c93cb4fd1f498d7013ee6bfb25783ea21593d5834f5d250ece66"),
    .uniswap: Array<UInt8>(hex: "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f")
]

enum UniType: String {
    case apeswap, pancakeswap, uniswap
}

struct UniswapV2Exchange {
    let name: UniType
    let routerAddress: EthereumAddress
    let factoryAddress: EthereumAddress
}
