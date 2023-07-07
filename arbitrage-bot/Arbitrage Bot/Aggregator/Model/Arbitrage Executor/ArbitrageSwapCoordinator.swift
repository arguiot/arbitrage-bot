//
//  ArbitrageSwapCoordinator.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 06/07/2023.
//

import Foundation

class ArbitrageSwapCoordinator {
    func coordinateFlashSwapArbitrage(with optimum: BuilderStep.OptimumResult) async throws {
        let contract = Credentials.shared.web3.eth.Contract(type: SwapRouteCoordinator.self)
        let invocation = contract.startArbitrage(startAmount: optimum.amountIn.asBigUInt,
                                                 lapExchange: optimum.path[0].intermediary, // First must be the lap
                                                 steps: optimum.path)
        let from = Credentials.shared.privateWallet.address
        let gasPrice = try await Credentials.shared.web3.eth.gasPrice()
        let nonce = try await Credentials.shared.web3.eth.getTransactionCount(address: from, block: .latest)
        let tx = invocation.createTransaction(nonce: nonce,
                                              gasPrice: gasPrice,
                                              maxFeePerGas: EthereumQuantity(quantity: 20.gwei),
                                              maxPriorityFeePerGas: nil,
                                              gasLimit: 100000,
                                              from: from,
                                              value: 0,
                                              accessList: .init(),
                                              transactionType: .legacy)
        guard let signed = try tx?.sign(with: Credentials.shared.privateWallet, chainId: 97) else { return }
        let res = try await Credentials.shared.web3.eth.sendRawTransaction(transaction: signed)
    }
}
