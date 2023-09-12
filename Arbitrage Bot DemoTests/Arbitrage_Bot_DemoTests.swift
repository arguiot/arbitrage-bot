//
//  Arbitrage_Bot_DemoTests.swift
//  Arbitrage Bot DemoTests
//
//  Created by Arthur Guiot on 03/07/2023.
//

import XCTest
import Euler
@testable import Arbitrage_Bot
@testable import Arbitrage_Bot_Demo

class Arbitrage_Bot_DemoTests: XCTestCase {
    override func setUpWithError() throws {
        Environment.shared["TESTNET_JSON_RPC_URL"] = "wss://newest-clean-brook.bsc-testnet.discover.quiknode.pro/a7741560cac07bb20c2dce045b38655fad4569b8/"
        Environment.shared["JSON_RPC_URL"] = "wss://eth.llamarpc.com"
        Environment.shared["WALLET_PRIVATE_KEY"] = try EthereumPrivateKey().hex()
    }
    
    func runBellmanFord(rates: [Double], size: Int, source: Int32, direct: Bool = false) -> ([Int32], Int32, Double) {
        var flatRates = rates
        
        var weights = [Double]()
        
        var cycle = [Int32](repeating: 0, count: size * 2)
        var cycleWeight: Double = 0
        var cycleLength: Int32 = 0
        
        flatRates.withUnsafeBufferPointer { cFlatRates in
            cycle.withUnsafeMutableBufferPointer { cCycle in
                withUnsafeMutablePointer(to: &cycleWeight) { cCycleWeight in
                    withUnsafeMutablePointer(to: &cycleLength) { cCycleLength in
                        weights.withUnsafeMutableBufferPointer { cWeights in
                            if direct {
                                BellmanFord(cFlatRates.baseAddress, size, source, cCycle.baseAddress!, cCycleWeight, cCycleLength)
                            } else {
                                calculate_neg_log(cFlatRates.baseAddress, cWeights.baseAddress, Int32(size * size))
                                BellmanFord(cWeights.baseAddress, size, source, cCycle.baseAddress!, cCycleWeight, cCycleLength)
                            }
                        }
                    }
                }
            }
        }
        let c = cycle.prefix(Int(cycleLength))
        return (Array(c), cycleLength, cycleWeight)
    }

    
    // Test 1: Positive Cycle
    func testPositiveCycle() async throws {
        let rates = [1.0, 0.75, 1.5,
                     1.25, 1.0, 0.66,
                     0.85, 1.66, 1.0]
        let logr = [0, 0.287, -0.405,
                    -0.223, 0, 0.416,
                    0.163, -0.507, 0
        ]
        let (cycle, cycleLength, cycleWeight) = runBellmanFord(rates: rates, size: 3, source: 0)
        
        // Check: it should find 3 coins (0-1-2) forming a cycle
        XCTAssertLessThan(cycleWeight, 0)
        XCTAssertEqual(cycleLength, 4)
        XCTAssertEqual(cycle, [0, 2, 1, 0])
    }
    
    // Test 2: No Cycle
    func testNoCycle() async throws {
        let rates = [1.0, 1.5, 0.1,
                     0.66, 1.0, 0.85,
                     0.5, 1.2, 1.0]
        let (cycle, cycleLength, cycleWeight) = runBellmanFord(rates: rates, size: 3, source: 0)
        
        // Check: it should not be able to find any cycle
        XCTAssertEqual(cycleWeight, 0)
    }
    
    // Test 3: Multiple possible cycles
    func testMultipleCycles() async throws {
        let rates = [1.0, 0.75, 0.85, 1.5,
                     0.8, 1.0, 0.66, 2,
                     0.85, 1.5, 1.0, 0.85,
                     0.66, 0.5, 0.75, 1.0]
        
        let (cycle, cycleLength, cycleWeight) = runBellmanFord(rates: rates, size: 4, source: 0)
        // call and check against expected output
        // it should find a shortest cycle in (0-1-2) or (1-2-3)
        XCTAssertLessThan(cycleWeight, 0)
        XCTAssertEqual(cycleLength, 5)
        XCTAssertEqual(cycle, [0, 3, 2, 1, 0])
    }
    
    // Test 4: Medium Cycle
    func testMediumCycle() async throws {
        let rates = [1.0, 0.6, 2.0, 1.75, 1.2,
                     1.3, 1.0, 2.5, 0.8, 1.1,
                     0.66, 0.4, 1.0, 0.85, 0.8,
                     0.5, 1.15, 0.66, 1.0, 0.75,
                     0.85, 0.9, 0.66, 1.3, 1.0]
        
        // call and check against expected output
        // it should find 5 coins (0, 3, 1, 2, 4) forming a cycle
        let (cycle, cycleLength, cycleWeight) = runBellmanFord(rates: rates, size: 5, source: 0)
        XCTAssertLessThan(cycleWeight, 0)
        XCTAssertEqual(cycleLength, 5)
        XCTAssertEqual(cycle, [0, 3, 1, 2, 4])
    }
    
    func testLargeCycle() async throws {
        // Initialize 40000 elements in the array with random values between 0.1 and 2.
        var rates: [Double] = (0..<200*200).map { _ in Double.random(in: 0.1...2.0) }
        
        // Define a cycle
        let cycleWeights: [Double] = [1.0, 0.6, 2.0, 1.75, 1.2]
        
        // Update the rates to reflect the cycle
        for i in 0..<5 {
            rates[i*200 + ((i+1)%5)] = cycleWeights[i]
        }
        
        // Call and check against expected output.
        // It should find the 5 coins (0, 1, 2, 3, 4) forming a cycle.
        let (_, _, cycleWeight) = runBellmanFord(rates: rates, size: 15, source: 0)
        XCTAssertLessThan(cycleWeight, 0)
    }
    
    func testRealisticCycle() async throws {
        let inf = Double.infinity
        let rates = [
            1.000000,1076485.935308,0.061395,1077914.955161,1600.430817,1078042.756853,221415638.498687,1601.117555,1603.335380,1076488.855474,
            0.000001,1.000000,inf,inf,inf,inf,inf,inf,inf,inf,
            16.288030,inf,1.000000,inf,25753.217221,inf,inf,26163.940876,25879.564202,inf,
            0.000001,inf,inf,1.000000,inf,inf,inf,inf,inf,inf,
            0.000625,inf,0.000039,inf,1.000000,inf,34678.426361,0.999243,0.998754,inf,
            0.000001,inf,inf,inf,inf,1.000000,inf,inf,inf,inf,
            0.000000,inf,inf,inf,0.000029,inf,1.000000,0.000007,0.000007,inf,
            0.000625,inf,0.000038,inf,1.000661,inf,137432.922966,1.000000,1.001291,inf,
            0.000624,inf,0.000039,inf,1.001248,inf,139526.876104,0.998710,1.000000,inf,
            0.000001,inf,inf,inf,inf,inf,inf,inf,inf,1.000000,
        ]
        
        let (cycle, cycleLength, cycleWeight) = runBellmanFord(rates: rates, size: 10, source: 0)
        
        // Check: it should find 3 coins (0-1-2) forming a cycle
        XCTAssertLessThan(cycleWeight, 0)
        XCTAssertEqual(cycleLength, 4)
        XCTAssertEqual(cycle, [0, 8, 7, 6])
    }
}
