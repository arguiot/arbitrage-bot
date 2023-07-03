//
//  Arbitrage_Bot_DemoTests.swift
//  Arbitrage Bot DemoTests
//
//  Created by Arthur Guiot on 03/07/2023.
//

import XCTest
@testable import Arbitrage_Bot_Demo

class Arbitrage_Bot_DemoTests: XCTestCase {
    func testOnTick() throws {
        let rates: [Double] = [1.0, 0.0005495336790505677, .infinity, 2.0,
                               1825.9812561052, 1.0, 400.0, .infinity,
                               .infinity, 0.0025, 1.0, 1.23,
                               0.5, .infinity, 2.3109486084916444, 1.0]
        let tokens: [CToken] = [/* Your testing data here */]
        let size: Int = 4
    }
}
