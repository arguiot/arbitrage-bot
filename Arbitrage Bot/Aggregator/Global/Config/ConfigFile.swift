//
//  ConfigFile.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 30/08/2023.
//

import Foundation

struct ConfigFile: Decodable {
    /// Wether to start the next js interface or not
    var headless: Bool
    /// If set to true, trades will not be performed, but theorically performed and saved for later analysis
    var testingMode: Bool
    /// The default environment
    var environment: BotRequest.Environment = .production
    /// Initial tracked assets with their queries
    var queries: [BotRequest.Query]
    /// If set to true, the bot will start arbitrage
    var active: Bool
}
