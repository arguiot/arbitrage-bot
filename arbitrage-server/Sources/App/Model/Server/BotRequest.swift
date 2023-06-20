//
//  BotRequest.swift
//
//
//  Created by Arthur Guiot on 19/06/2023.
//

import Foundation

struct BotRequest: Codable {
    struct Token: Codable {
        var name: String
        var address: String
    }
    
    enum Environment: String, Codable {
        case development, production
    }
    
    struct Query: Codable {
        var exchange: String
        var type: ExchangeType?
        var tokenA: Token
        var tokenB: Token
        var amountIn: Double?
        var amountOut: Double?
        var routerAddress: String?
        var factoryAddress: String?
    }
    
    var type: BotMessageType
    var topic: BotTopic
    var environment: Environment
    var query: Query?
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(BotMessageType.self, forKey: .type)
        topic = try container.decode(BotTopic.self, forKey: .topic)
        environment = try container.decodeIfPresent(Environment.self, forKey: .environment) ?? .production
        query = try container.decodeIfPresent(Query.self, forKey: .query)
    }
    

    enum DecodingError: LocalizedError {
        case dataCorrupted
        
        var errorDescription: String? {
            switch self {
            case .dataCorrupted:
                return "The data is corrupted"
            }
        }
    }

    static func fromJSON(jsonString: String) throws -> BotRequest {
        let jsonData = jsonString.data(using: .utf8)
        guard let data = jsonData else { throw DecodingError.dataCorrupted }
        
        let decoder = JSONDecoder()
        let request = try decoder.decode(BotRequest.self, from: data)
        return request
    }
}
