//
//  Cash.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 04/07/2023.
//

import Foundation
import Euler

extension Euler.BigInt {
    init(cash: Int) {
        self = BigInt(cash) * 10 ** 18
//        self.decimals = 18
    }
    
    init(cash: Euler.BigInt) {
        self = cash
//        self.decimals = 18
    }
    
    var uncash: Euler.BigInt {
        var n = self
        n.decimals = 0
        return n
    }
    
    var cash: Euler.BigInt {
        if self.decimals != 18 {
            var n = Euler.BigInt(self) * Euler.BigInt(10) ** (18 - self.decimals)
            n.decimals = 18
            return n
        }
        return self
    }
}

extension BN {
    var cash: Euler.BigInt {
        var n = (self * Euler.BigInt(10) ** 18).rounded()
//        n.decimals = 18
        return n
    }
    
    init(cash: Euler.BigInt) {
        self.init(cash, over: 10 ** 18)
    }
    
    var debugDescription: String {
        return decimalDescription
    }
}

extension BinaryInteger {
    var cash: Euler.BigInt {
        var n = Euler.BigInt(self) * Euler.BigInt(10) ** 18
//        n.decimals = 18
        return n
    }
}
