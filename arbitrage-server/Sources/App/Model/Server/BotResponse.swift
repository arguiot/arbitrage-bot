//
//  File.swift
//  
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

public struct BotResponse: Codable {
    enum Status: String, Codable {
        case success
        case error
    }
    
    let status: Status
    let topic: BotTopic
    var error: String? = nil
    
    
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

    func toJSON() throws -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        let data = try encoder.encode(self)
        guard let json = String(data: data, encoding: .utf8) else {
            throw EncodingError.unknown
        }
        return json
    }
}
