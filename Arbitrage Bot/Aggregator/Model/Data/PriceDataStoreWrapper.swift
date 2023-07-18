//
//  PriceDataStoreWrapper.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 26/06/2023.
//

import Foundation

@objc public class PriceDataStoreWrapper: NSObject {
    internal var adjacencyList = AdjacencyList()
    
    @objc public static var shared: PriceDataStoreWrapper? = nil
    
    var callback: (([Double], [Token], UInt32) -> Void)? = nil
    
    @objc static public func createStore() {
        self.shared = PriceDataStoreWrapper()
    }
    
    func dispatch(time: UInt32) {
        guard let callback = self.callback else { return }
        Task {
            let spot = await self.adjacencyList.spotPicture // Take a picture of the price data store
            await callback(spot, self.adjacencyList.tokens, time)
        }
    }
}
