//
//  File.swift
//  
//
//  Created by Arthur Guiot on 21/06/2023.
//

import Foundation

public struct Environment {
    public static var shared = [String: String]()
    public static func get(_ key: String) -> String? {
        return Self.shared[key]
    }
}
