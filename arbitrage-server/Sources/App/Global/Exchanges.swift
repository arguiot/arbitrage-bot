//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

struct ExchangeInfo: Codable {
    let name: String
    let type: String
    var adapter: String? = nil
    var routerAddress: String? = nil
    var factoryAddress: String? = nil
    var coordinatorAddress: String? = nil
    var testnet: Bool? = nil
}

struct IExchangesList: Codable {
    let development: [String: ExchangeInfo]
    let production: [String: ExchangeInfo]
}

let ExchangesList: IExchangesList = IExchangesList(
    development: [
        "uniswap": ExchangeInfo(
            name: "Uniswap V2",
            type: "dex",
            adapter: "uniswap",
            routerAddress: "0xF76921660f6fcDb161A59c77d5daE6Be5ae89D20",
            factoryAddress: "0xADf1687e201d1DCb466D902F350499D008811e84",
            coordinatorAddress: "0x6db4fa64f67AADc606deFAFA8106E83113d2f730"
        ),
        "pancakeswap": ExchangeInfo(
            name: "PancakeSwap",
            type: "dex",
            adapter: "uniswap",
            routerAddress: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
            factoryAddress: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
            coordinatorAddress: "0x6db4fa64f67AADc606deFAFA8106E83113d2f730"
        ),
        "apeswap": ExchangeInfo(
            name: "ApeSwap",
            type: "dex",
            adapter: "uniswap",
            routerAddress: "0x1c6f40e550421D4307f9D5a878a1628c50be0C5B",
            factoryAddress: "0x5722F3b02b9fe2003b3045D73E9230684707B257",
            coordinatorAddress: "0x6db4fa64f67AADc606deFAFA8106E83113d2f730"
        ),
        "binance": ExchangeInfo(
            name: "Binance",
            type: "cex",
            testnet: true
        )
    ],
    production: [
        "uniswap": ExchangeInfo(
            name: "Uniswap V2",
            type: "dex"
        ),
        "binance": ExchangeInfo(
            name: "Binance",
            type: "cex"
        ),
        "kraken": ExchangeInfo(
            name: "Kraken",
            type: "cex"
        )
    ]
)
