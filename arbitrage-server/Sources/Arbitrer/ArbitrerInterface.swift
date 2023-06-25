//
//  Arbiter.swift
//
//
//  Created by Arthur Guiot on 23/06/2023.
//

@_cdecl("start_server")
public func startServer() -> OpaquePointer {
    let controller = RealtimeServerController { res in
        print(res)
    }
    let retained = Unmanaged.passRetained(controller).toOpaque()
    return OpaquePointer(retained)
}

import Foundation

final class MyType {
    var count: Int = 69
}

@_cdecl("test")
public func mytype_create() -> Int {
    let type = MyType()
    return type.count
}
