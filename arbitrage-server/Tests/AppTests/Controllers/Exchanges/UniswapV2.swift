//
//  UniswapV2.swift
//
//
//  Created by Arthur Guiot on 20/06/2023.
//

@testable import App
import XCTVapor
import Web3

final class UniswapV2Tests: XCTestCase {
    func testPairFor() async throws {
        let uniV2Router = ExchangesList.development["uniswap"]!.routerAddress!
        let uniV2Factory = ExchangesList.development["uniswap"]!.factoryAddress!
        
        let uniV2RouterContract = Credentials.shared.web3.eth.Contract(type: UniswapV2Router.self, address: uniV2Router)
        
        let uniswapV2 = UniswapV2(delegate: uniV2RouterContract, factory: uniV2Factory)
        let tokenA = TokenList[.wethBsctestnet]!
        let tokenB = TokenList[.usdtBsctestnet]!
        
        let pairAddress = try? uniswapV2.pairFor(factory: uniV2Factory, tokenA: tokenA.address, tokenB: tokenB.address)
        XCTAssertEqual(pairAddress?.hex(eip55: false), "0xDf14c38E3bCcCD40981A879019b70BE41395cf69".lowercased())
    }
    
    func testGetReserves() async throws {
        let uniV2Router = ExchangesList.development["uniswap"]!.routerAddress!
        let uniV2Factory = ExchangesList.development["uniswap"]!.factoryAddress!
        
        let uniV2RouterContract = Credentials.shared.web3.eth.Contract(type: UniswapV2Router.self, address: uniV2Router)
        
        let uniswapV2 = UniswapV2(delegate: uniV2RouterContract, factory: uniV2Factory)
        let tokenA = TokenList[.wethBsctestnet]!
        let tokenB = TokenList[.usdtBsctestnet]!
        
        let (reserve0, reserve1) = try await uniswapV2.getReserves(factory: uniV2Factory, tokenA: tokenA.address, tokenB: tokenB.address)
        
        XCTAssert(reserve0 > 0)
        XCTAssert(reserve1 > 0)
    }
    
    func testGetPrice() async throws {
        let uniV2Router = ExchangesList.development["uniswap"]!.routerAddress!
        let uniV2Factory = ExchangesList.development["uniswap"]!.factoryAddress!
        
        let uniV2RouterContract = Credentials.shared.web3.eth.Contract(type: UniswapV2Router.self, address: uniV2Router)
        
        let uniswapV2 = UniswapV2(delegate: uniV2RouterContract, factory: uniV2Factory)
        let tokenA = TokenList[.wethBsctestnet]!
        let tokenB = TokenList[.usdtBsctestnet]!
        
        let quote = try await uniswapV2.getQuote(maxAvailableAmount: 1, tokenA: tokenA, tokenB: tokenB, maximizeB: true, meta: nil)
        
        XCTAssert(quote.price > 0)
        XCTAssert(quote.price.nearlyEquals(quote.transactionPrice, epsilon: 50)) // 50$ difference
    }
}
