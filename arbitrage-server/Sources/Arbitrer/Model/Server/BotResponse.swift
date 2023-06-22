//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

public struct BotResponse: Sendable, Codable {
    public enum Status: String, Codable, Sendable {
        case success
        case error
    }
    
    public let status: Status
    public let topic: BotTopic
    public var error: String? = nil
    var quote: Quote? = nil
    
    public init(status: Status, topic: BotTopic, error: String? = nil) {
        self.status = status
        self.topic = topic
        self.error = error
    }
    
    enum EncodingError: LocalizedError {
        case dataCorrupted
        case invalidValue
        case unknown
        
        var errorDescription: String? {
            switch self {
            case .dataCorrupted:
                return "Data corrupted"
            case .invalidValue:
                return "Invalid value"
            case .unknown:
                return "Unknown error"
            }
        }
    }

    public func toJSON() throws -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        let data = try encoder.encode(self)
        guard let json = String(data: data, encoding: .utf8) else {
            throw EncodingError.unknown
        }
        return json
    }
}

