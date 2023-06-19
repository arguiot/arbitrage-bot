//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

enum BotMessageType: String, Codable {
    case subscribe, unsubscribe, silent, reset, buy
}

enum BotTopic: String, Codable {
    case priceData, decision, reset, buy, none
}
