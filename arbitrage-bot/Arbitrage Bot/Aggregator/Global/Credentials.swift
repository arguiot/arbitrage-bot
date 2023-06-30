//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation
import Web3


public class Credentials {
    static let shared = try! Credentials()
    
    let web3: Web3
    
    let privateWallet: EthereumPrivateKey
    
    enum EnvironmentError: Error {
        case undefinedVariable
    }
    
    init() throws {
        guard let jsonRPC = Environment.get("JSON_RPC_URL") else { throw EnvironmentError.undefinedVariable }
        self.web3 = try Web3(wsUrl: jsonRPC)
        
        print("Connected to \(jsonRPC)")
        
        guard let privateKey = Environment.get("WALLET_PRIVATE_KEY") else { throw EnvironmentError.undefinedVariable }
        self.privateWallet = try EthereumPrivateKey(hexPrivateKey: privateKey)
        
        print("Using Wallet: \(self.privateWallet.address.hex(eip55: false))")
    }
}
