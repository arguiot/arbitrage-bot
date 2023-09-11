//
//  UniswapV3Router.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 01/08/2023.
//

import Foundation
import BigInt

public protocol UniswapV3RouterContract: EthereumContract {
    func exactInput(params: ExactInputParams) -> SolidityInvocation
}

open class UniswapV3Router: StaticContract, UniswapV3RouterContract {
    public var address: EthereumAddress?
    public let eth: Web3.Eth
    
    open var constructor: SolidityConstructor?
    
    open var events: [SolidityEvent] {
        return []
    }
    
    public required init(address: EthereumAddress?, eth: Web3.Eth) {
        self.address = address
        self.eth = eth
    }
}

public extension UniswapV3RouterContract {
    func exactInput(params: ExactInputParams) -> SolidityInvocation {
        let method = SolidityNonPayableFunction(name: "exactInput", inputs: [
            SolidityFunctionParameter(name: "path", type: .bytes(length: nil)),
            SolidityFunctionParameter(name: "recipient", type: .address),
            SolidityFunctionParameter(name: "deadline", type: .uint256),
            SolidityFunctionParameter(name: "amountIn", type: .uint256),
            SolidityFunctionParameter(name: "amountOutMinimum", type: .uint256)
        ], handler: self)
        return method.invoke(params)
    }
}

public struct ExactInputParams: ABIEncodable {
    let path: Data
    let recipient: EthereumAddress
    let deadline: BigUInt
    let amountIn: BigUInt
    let amountOutMinimum: BigUInt
    
    public func abiEncode(dynamic: Bool) -> String? {
        // Encode path, recipient, deadline, amountIn, amountOutMinimum values as strings
        let mapValues = [
            path.abiEncode(dynamic: dynamic),
            recipient.abiEncode(dynamic: dynamic),
            deadline.abiEncode(dynamic: dynamic),
            amountIn.abiEncode(dynamic: dynamic),
            amountOutMinimum.abiEncode(dynamic: dynamic),
        ].compactMap { $0 }  // Use compactMap to remove nil values
        
        let length = String(mapValues.count, radix: 16).paddingLeft(toLength: 64, withPad: "0")
        return length + mapValues.joined()
    }
}
