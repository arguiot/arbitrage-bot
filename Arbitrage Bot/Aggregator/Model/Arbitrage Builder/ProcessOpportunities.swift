//
//  ProcessOpportunities.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 03/07/2023.
//

import Foundation
import Euler
import CollectionConcurrencyKit

extension Builder {
    enum BuilderProcessError: LocalizedError {
        case noOpportunity
        case notProfitable
        
        var errorDescription: String {
            switch self {
            case .noOpportunity:
                return "No opportunity could be computed"
            case .notProfitable:
                return "Opportunity is not profitable after further review"
            }
        }
    }
    func process(systemTime: Int) {
        guard self.lock == false else {
            print("Locked!")
            return
        }
//        guard self.systemTime == systemTime else {
//            print("Aborted!")
//            print(self.systemTime, systemTime)
//            return
//        }
        self.lock = true
        
        Task(timeout: 5) {
            // It's okay to do that, because we start from a single node
            let all = await self.steps.concurrentCompactMap { step in
                do {
                    return try step.optimalPrice()
                } catch {
                    print(error.localizedDescription)
                    try! step.price(for: BN(1).cash)
                    return nil
                }
            }
            
            guard all.count > 0 else { throw BuilderProcessError.noOpportunity }
            
            let bestOpportunity = all
                .reduce(BuilderStep.OptimumResult(amountIn: .zero, amountOut: .zero, path: []), {
                    max($0.amountOut, $1.amountOut) == $0.amountOut ? $0 : $1
                })
            
            var amountIn = bestOpportunity.amountIn
            amountIn.decimals = 18
            
            guard bestOpportunity.amountOut > amountIn else {
                throw BuilderProcessError.notProfitable
            }
            
            print(bestOpportunity.path.map { "\($0.token) -> " })
            
            print("Best: \(amountIn) -> \(bestOpportunity.amountOut)")
            
            try await DecisionDataPublisher.shared.coordinator.coordinateFlashSwapArbitrage(with: bestOpportunity)
        } deferred: { error in
            if let error = error {
                print(error.localizedDescription)
            }
            self.lock = false
        }
    }
}
