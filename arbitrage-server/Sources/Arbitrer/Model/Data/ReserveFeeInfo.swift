//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import BigInt

struct ReserveFeeInfo<Meta> {
    let exchange: AnyExchange
    let meta: Meta
    let fee: BigUInt
}
