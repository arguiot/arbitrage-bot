//
//  PriceDataSubscription.swift
//
//
//  Created by Arthur Guiot on 21/06/2023.
//

import OpenCombine
import Web3

class PriceDataSubscription {
    private let web3 = Credentials.shared.web3
    private let callback: (Result<(BotResponse, Int), Error>) -> Void
    internal let subscriptions = PriceDataSubscriptionState()
    
    init(callback: @escaping (Result<(BotResponse, Int), Error>) -> Void) {
        self.callback = callback
        subscribeToNewHeads()
    }
    
    func dispatch(with type: PriceDataSubscriptionType) {
        guard subscriptions.activeSubscriptions.count > 0 else { return }
        Task {
            let clock = ContinuousClock()
            
            var responses = [(BotResponse, Int)]()
            
            let time = await clock.measure {
                responses = await self.subscriptions.meanPrice(for: .ethereumBlock)
            }
            
            for var response in responses {
                response.0.queryTime = time
                self.callback(.success(response))
            }
            
            print("Dispatched prices in \(time.ms)ms")
            
            // Dispatch to front-end
            PriceDataStoreWrapper.shared?.dispatch()
        }
    }
    
    private func subscribeToNewHeads() {
        do {
            try web3.eth.subscribeToNewHeads { resp in
                print("Listening to new heads")
            } onEvent: { resp in
                print("New block: \(resp.result?.number?.quantity ?? 0)")
                self.dispatch(with: .ethereumBlock)
            }
        } catch {
            print("Error: \(error.localizedDescription)")
            self.callback(.failure(error))
        }
    }
}

