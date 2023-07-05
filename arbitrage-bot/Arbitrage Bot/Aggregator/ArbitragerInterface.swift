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

// MARK: - Store
@_cdecl("attach_tick_price_data_store")
public func attachTick(callback: @escaping (UnsafePointer<Double>, UnsafePointer<UInt8>, UInt32, UInt32) -> Void) {
    PriceDataStoreWrapper.shared?.callback = { array, tokens, time in
        guard let addresses = tokens.map(\.address.rawAddress).flatten() as? [UInt8] else { return }
        
        addresses.withUnsafeBufferPointer { cAddresses in
            guard let baseAddress = cAddresses.baseAddress else { return }
            array.withUnsafeBufferPointer { cArray in
                guard let base = cArray.baseAddress else { return }
                print(array);
                print(tokens.map(\.name))
                callback(base, baseAddress, UInt32(tokens.count), time)
            }
        }
    }
}

@_cdecl("name_for_token")
public func name(for tokenAddress: UnsafePointer<UInt8>, result: UnsafeMutablePointer<UnsafeMutablePointer<CChar>>) {
    let byteCount = 20 // The length of the address
    let tokenAddressData = Data(bytes: tokenAddress, count: byteCount)
    let fullAddress = tokenAddressData.bytes
    
    if let token = TokenList.values.first(where: { $0.address.rawAddress == fullAddress }) {
        guard let cString = strdup(token.name) else { return }
        result.initialize(to: cString)
    }
}

@_cdecl("add_opportunity_for_review")
public func addOpportunityForReview(order: UnsafePointer<Int32>, size: Int, systemTime: Int) {
    let list = UnsafeBufferPointer(start: order, count: size)
    let arbitrageOrder = Array(list)
    Task {
        guard let step = try await PriceDataStoreWrapper
            .shared?
            .adjacencyList
            .buildSteps(from: arbitrageOrder.map { Int($0) }) else { return }
        
        PriceDataStoreWrapper
            .shared?
            .adjacencyList
            .builder
            .add(step: step, with: systemTime)
    }
}

@_cdecl("review_and_process_opportunities")
public func reviewAndProcessOpportunities(systemTime: Int) {
    PriceDataStoreWrapper
        .shared?
        .adjacencyList
        .builder
        .process(systemTime: systemTime)
}

// MARK: - Realtime Server

@_cdecl("create_realtime_server_controller")
public func createRealtimeServerController(callback: @escaping (@convention(c) (UnsafePointer<CChar>, UInt16, UnsafeRawPointer) -> Void), userData: UnsafeRawPointer) -> Int {
    let id = controllers.count
    let controller = RealtimeServerControllerWrapper(id: id, userData: userData, callback: callback)
    controllers[id] = controller
    return id
}

@_cdecl("close_realtime_server_controller")
public func closeRealtimeServerController(id: Int) {
    controllers.removeValue(forKey: id)
}

@_cdecl("realtime_server_handle_request")
public func handleRequest(controllerId: Int, request: UnsafePointer<CChar>, size: Int) {
    guard let controller = controllers[controllerId] else {
        print("No controller found with this ID")
        return
    }
    let requestString = String(cString: request).prefix(size)
    controller.handleRequest(request: String(requestString), completion: { error in
        print("Request failed: \(error)")
    })
}
