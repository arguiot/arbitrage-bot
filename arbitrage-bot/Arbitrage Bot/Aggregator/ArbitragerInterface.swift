//
//  ArbitragerInterface.swift
//  Arbitrage-Bot
//
//  Created by Arthur Guiot on 23/06/2023.
//

import Foundation

//@_cdecl("create_controller")
//public func create_controller() -> OpaquePointer {
//    let type = RealtimeServerController { res in
//        print(res)
//    }
//    let retained = Unmanaged.passRetained(type).toOpaque()
//    return OpaquePointer(retained)
//}

@_cdecl("attach_tick_price_data_store")
public func attachTick(callback: @escaping (UnsafePointer<Double>, UnsafePointer<UInt8>, UInt32) -> Void) {
    PriceDataStoreWrapper.shared?.callback = { array, tokens in
        guard let addresses = tokens.map(\.address.rawAddress).flatten() as? [UInt8] else { return }
        
        addresses.withUnsafeBufferPointer { cAddresses in
            guard let baseAddress = cAddresses.baseAddress else { return }
            array.withUnsafeBufferPointer { cArray in
                guard let base = cArray.baseAddress else { return }
                callback(base, baseAddress, UInt32(tokens.count))
            }
        }
    }
}
