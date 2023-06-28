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
public func attachTick(callback: @escaping (UnsafePointer<Double>, CInt) -> Void) {
    PriceDataStoreWrapper.shared?.callback = { array in
        array.withUnsafeBufferPointer { cArray in
            guard let base = cArray.baseAddress else { return }
            callback(base, CInt(cArray.count))
        }
    }
}
