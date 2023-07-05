//
//  PriceCalculation.swift
//  Arbitrage-BotTests
//
//  Created by Arthur Guiot on 03/07/2023.
//

import XCTest
@testable import Arbitrage_Bot
import Euler
import SwiftPlot
import AGGRenderer

final class PriceCalculation: XCTestCase {

    override func setUpWithError() throws {
        Environment.shared["JSON_RPC_URL"] = "wss://newest-clean-brook.bsc-testnet.discover.quiknode.pro/a7741560cac07bb20c2dce045b38655fad4569b8/"
        Environment.shared["WALLET_PRIVATE_KEY"] = try EthereumPrivateKey().hex()
    }

    func testUniswapV2() throws {
        let uniswap = ExchangesList.shared.development.uniswap.exchange as! UniswapV2
        let meta = UniswapV2.RequiredPriceInfo(routerAddress: .zero, factoryAddress: .zero, reserveA: 12345678912345, reserveB: 10000000000)
        
        self.measure {
            for _ in 0..<1000 {
                let price = try? uniswap.getAmountOut(amountIn: Euler.BigInt(Int.random(in: 12345678...1234123456789)), meta: meta)
                XCTAssert(price ?? 0 > 0)
            }
        }
    }

    func reserveFee(price: BN, base: Euler.BigInt = 1000.eth.euler, id: Int = 1) -> ReserveFeeInfo {
        let meta = UniswapV2.RequiredPriceInfo(routerAddress: .zero, factoryAddress: .zero, reserveA: base, reserveB: (base * price).rounded())
        return ReserveFeeInfo(exchangeKey: \.development.uniswap.exchange, meta: meta, spot: price.asDouble()!, tokenA: .fake(id: id), tokenB: .fake(id: id + 1), fee: 3)
    }
    
    func testOptimiser() async throws {
        let step1 = BuilderStep(reserveFeeInfos: [
            reserveFee(price: 1800, base: 1.cash),
            reserveFee(price: 1200, base: 100.cash), // Should be chosen, because better reserves
            reserveFee(price: 1100, base: 100.cash)
        ])
        
        let step2 = BuilderStep(reserveFeeInfos: [
            reserveFee(price: 0.55, id: 3),
            reserveFee(price: 0.56, id: 3),
            reserveFee(price: 0.57, id: 3) // Should be chosen
        ])
        
        let step3 = BuilderStep(reserveFeeInfos: [
            reserveFee(price: 23, id: 5),
            reserveFee(price: 25, id: 5),
            reserveFee(price: 24.5, id: 5) // Should be chosen
        ])
        
        step2.next = step3
        step1.next = step2
        
        
        self.measure {
            let price = try! step1.optimalPrice()
            
            XCTAssertEqual(price.amountIn.description.split(separator: ".").first, 68.cash.description.split(separator: ".").first)
            XCTAssertEqual(price.amountOut.description.split(separator: ".").first, 8941.cash.description.split(separator: ".").first)
        }
        
        step1.drawGraph()
    }
}
