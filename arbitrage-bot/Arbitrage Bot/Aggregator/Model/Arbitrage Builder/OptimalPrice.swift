//
//  OptimalPrice.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 03/07/2023.
//

import Foundation
import Euler

extension BuilderStep {
    struct PartialOptimum {
        let step: Euler.BigInt
        let amount: Euler.BigInt
        let chain: [ReserveFeeInfo]
    }
    
    struct OptimumResult {
        let optimalPrice: Euler.BigInt
        let path: [ReserveFeeInfo]
    }
    
    func optimalPrice() async throws -> OptimumResult {
        var currentPrice = BigInt(100000000) // Starting point
        var currentStep = BigInt(1) // Initial step size
        let initialPriceInfo = try await self.price(for: currentPrice)
        
        // Initialize the PartialOptimum object with default values.
        var bestAmountOut = PartialOptimum(
            step: currentStep,
            amount: initialPriceInfo.0,
            chain: initialPriceInfo.1)
        
        while true {
            var bestStepSize: Euler.BigInt? = nil
            
            // Check a few different step sizes in parallel
            try await withThrowingTaskGroup(of: PartialOptimum.self) { group in
                for stepSize in stride(from: currentStep - 1, through: currentStep + 1, by: 1) {
                    let localCurrentPrice = currentPrice
                    group.addTask {
                        let newPriceInfo = try await self.price(for: localCurrentPrice + stepSize)
                        return PartialOptimum(
                            step: stepSize,
                            amount: newPriceInfo.0,
                            chain: newPriceInfo.1)
                    }
                }
                
                for try await result in group {
                    if result.amount > bestAmountOut.amount {
                        bestAmountOut = result
                        bestStepSize = result.step
                    }
                }
            }
            
            // If no better step size found, we've reached the peak.
            if bestStepSize == nil {
                break
            }
            
            currentPrice += bestStepSize!
            currentStep = max(BigInt(1), abs(bestStepSize! / 2)) // Half the step size, but keep it at least 1
        }
        
        // Return optimal price and associated chain of exchanges.
        return OptimumResult(optimalPrice: currentPrice, path: bestAmountOut.chain)
    }
}
