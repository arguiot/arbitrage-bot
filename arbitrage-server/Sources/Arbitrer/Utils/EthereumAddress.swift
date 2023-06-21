//
//  File.swift
//  
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation
import Web3

extension EthereumAddress {
    static let zero = try! EthereumAddress(hex: "0x0000000000000000000000000000000000000000", eip55: false)
}
