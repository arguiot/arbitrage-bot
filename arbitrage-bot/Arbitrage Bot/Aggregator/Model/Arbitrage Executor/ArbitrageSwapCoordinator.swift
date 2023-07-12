//
//  ArbitrageSwapCoordinator.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 06/07/2023.
//

import Foundation
import Euler

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
        
        // MARK: - Dispatch Decision
        var response = BotResponse(status: .success, topic: .decision)
        guard let first = optimum.path.first?.token else { return }
        guard let token = TokenList.values.first(where: { $0.address == first }) else { return }
        response.executedTrade = Trade(timestamp: .now,
                                       token: token.name,
                                       startAmount: (BN(optimum.amountIn) / 1e18).asDouble() ?? 0,
                                       route: optimum.path.map { step in
                                            Trade.Route(exchange: step.exchangeName, token: step.tokenName)
                                       },
                                       profit: (BN(optimum.amountOut - optimum.amountIn) / 1e18).asDouble() ?? 0,
                                       fees: 0.03)
        
        DecisionDataPublisher.shared.publishDecision(decision: response)
        //        let res = try await Credentials.shared.web3.eth.sendRawTransaction(transaction: signed)
    }
}
