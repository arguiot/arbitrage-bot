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
    
    @objc static public func createStore() {
        self.shared = PriceDataStoreWrapper()
    }
}
