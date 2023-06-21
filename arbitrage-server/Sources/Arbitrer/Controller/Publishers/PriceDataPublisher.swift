//
//  PriceDataPublisher.swift
//
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation
import OpenCombine
import Web3

public class PriceDataPublisher: Publisher {
    public typealias Output = PriceDataSubscriptionType
    public typealias Failure = Error
    
    private let subject = PassthroughSubject<Output, Failure>()
    private var priceDataSubscription: PriceDataSubscription?
    
    init() {
        priceDataSubscription = PriceDataSubscription { [weak self] result in
            switch result {
            case .success(let priceDataType):
                self?.subject.send(priceDataType)
            case .failure(let error):
                self?.subject.send(completion: .failure(error))
            }
        }
    }
    
    public func receive<S>(subscriber: S) where S : Subscriber, Failure == S.Failure, Output == S.Input {
        subject.receive(subscriber: subscriber)
    }
}
