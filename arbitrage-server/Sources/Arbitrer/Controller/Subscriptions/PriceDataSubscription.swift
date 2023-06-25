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
    
    private func subscribeToNewHeads() {
        do {
            try web3.eth.subscribeToNewHeads { resp in
                print("Listening to new heads")
            } onEvent: { resp in
                Task {
                    print("New block: \(resp.result?.number?.quantity ?? 0)")
                    let responses = await self.subscriptions.meanPrice(for: .ethereumBlock)
                    for response in responses {
                        self.callback(.success(response))
                    }
                }
            }
        } catch {
            self.callback(.failure(error))
        }
    }
}

