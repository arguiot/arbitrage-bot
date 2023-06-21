//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import BigInt

struct ReserveFeeInfo {
    let exchangeID: Int
    let reserve0: BigUInt
    let reserve1: BigUInt
    let fee: BigUInt
}
