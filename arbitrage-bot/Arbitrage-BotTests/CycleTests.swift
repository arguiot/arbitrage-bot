//
//  Arbitrage_BotTests.swift
//  Arbitrage-BotTests
//
//  Created by Arthur Guiot on 23/06/2023.
//

import XCTest
import Euler
import Web3

@testable import Arbitrage_Bot

class CycleTests: XCTestCase {
    
    override func setUpWithError() throws {
        Environment.shared["JSON_RPC_URL"] = "wss://newest-clean-brook.bsc-testnet.discover.quiknode.pro/a7741560cac07bb20c2dce045b38655fad4569b8/"
        Environment.shared["WALLET_PRIVATE_KEY"] = try EthereumPrivateKey().hex()
    }

    
    func testExample() async throws {
        let rates: [[Double]] = [
            [1,0.23,0.25,16.43,18.21,4.94],
            [4.34,1,1.11,71.4,79.09,21.44],
            [3.93,0.9,1,64.52,71.48,19.37],
            [0.061,0.014,0.015,1,1.11,0.3],
            [0.055,0.013,0.014,0.9,1,0.27],
            [0.2,0.047,0.052,3.33,3.69,1]
        ]
        
        let tokens = [
            "CHF",
            "EUR",
            "USD",
            "GBP",
            "YEN",
            "CAD"
        ].map { Token(name: $0, address: .zero) }
        
        let list = AdjacencyList()
        let path = \ExchangesList.development.uniswap.exchange
        let exchange = ExchangesList.shared[keyPath: path] as! UniswapV2
        
        let pass: ((Double) -> ReserveFeeInfo) = { rate in
            let reserveB = 100.eth.euler * BN(rate)
            let meta = UniswapV2.RequiredPriceInfo(routerAddress: exchange.delegate.address!,
                                                   factoryAddress: exchange.factory,
                                                   reserveA: 100.eth.euler,
                                                   reserveB: reserveB.rounded())
            return ReserveFeeInfo(exchangeKey: path, meta: meta, spot: rate, fee: exchange.fee)
        }
        
        for tokenId in 0..<tokens.count {
            let inRates = rates[tokenId].map(pass)
            let outRates = rates.map { $0[tokenId] }.map(pass)
            
            for tokenId2 in 0..<inRates.count {
                await list.insert(tokenA: tokens[tokenId], tokenB: tokens[tokenId2], info: inRates[tokenId2])
                await list.insert(tokenA: tokens[tokenId2], tokenB: tokens[tokenId], info: outRates[tokenId2])
            }
        }
        
        let snapshot = await list.spotPicture
        XCTAssertEqual(snapshot, rates.flatten() as! [Double])
    }
    
}
