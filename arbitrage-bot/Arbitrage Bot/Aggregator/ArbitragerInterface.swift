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

@objc
public class ObjCToken: NSObject {
    @objc public let name: [CChar];
    @objc public let address: [UInt8]; // UInt8
    
    internal init(name: [CChar], address: [UInt8]) {
        self.name = name
        self.address = address
    }
}

@_cdecl("attach_tick_price_data_store")
public func attachTick(callback: @escaping (UnsafePointer<Double>, [ObjCToken]) -> Void) {
    PriceDataStoreWrapper.shared?.callback = { array, tokens in
        let objcTokens: [ObjCToken] = tokens
            .compactMap { token in
                guard let name = token.name.cString(using: .ascii) else { return nil }
                return ObjCToken(name: name, address: token.address.rawAddress)
            }
        array.withUnsafeBufferPointer { cArray in
            guard let base = cArray.baseAddress else { return }
            callback(base, objcTokens)
        }
    }
}
