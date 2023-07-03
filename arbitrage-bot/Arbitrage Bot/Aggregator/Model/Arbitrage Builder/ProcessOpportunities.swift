//
//  ProcessOpportunities.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 03/07/2023.
//

import Foundation

extension Builder {
    func process() {
        Task {
            // It's okay to do that, because we start from a single node
            let bestOpportunity = await self.steps.concurrentCompactMap { step in
                try! await step.optimalPrice()
            }
            .reduce(BuilderStep.OptimumResult(optimalPrice: 0, path: []), { max($0.optimalPrice, $1.optimalPrice) == $0.optimalPrice ? $0 : $1 })
            
            print(bestOpportunity.optimalPrice)
        }
    }
}
