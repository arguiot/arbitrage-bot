//
//  MatrixViz.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 31/08/2023.
//

import Foundation

#if canImport(SwiftUI)
import SwiftUI
import Charts

struct Entry: Hashable, Identifiable {
    var tokenA: Token
    var tokenB: Token
    var spotAB: Double
    
    var id: Int {
        self.hashValue
    }
}

struct MatrixViz: View {
    var data: [Entry]
    var body: some View {
        Chart(data) {
            RectangleMark(x: .value("TokenA", $0.tokenA.name), y: .value("TokenB", $0.tokenB.name))
                .foregroundStyle(
                    by: .value("Number", $0.spotAB)
                )
        }
    }
}

extension AdjacencyList {
    var entries: [Entry] {
        let size = tokens.count
        tokensPublisher.value = tokens
        guard size > 0 else { return [] }
        
        var flattenEntries = Array<Entry?>(repeating: nil, count: size * size)
        
        for i in 0..<flattenEntries.count {
            let row = i / size
            let col = i % size
            let price = getPrice(tokenA: tokens[row], tokenB: tokens[col])
            flattenEntries[i] = Entry(tokenA: tokens[row], tokenB: tokens[col], spotAB: price)
        }
        
        return flattenEntries.compactMap { $0 }
    }
    
    @objc nonisolated func debugQuickLookObject() -> AnyObject {
        var image: NSImage?
        
        DispatchQueue.main.async {
            let view = MatrixViz(data: self.entries)
                .frame(width: 300, height: 300)
            let renderer = ImageRenderer(content: view)
            renderer.scale = 2
            image = renderer.nsImage
        }
        
        while (image == nil) {
            RunLoop.current.run(mode: .default, before: Date(timeIntervalSinceNow: 1))
        }
        
        guard let img = image else {
            return "no image found" as AnyObject
        }
        
        return img
    }
    
    func copyCSV() {
        let entries = self.entries
        
        // Extract token names as unique ordered identifiers
        let tokenNames = Array(Set(entries.flatMap { [$0.tokenA.name, $0.tokenB.name] })).sorted()
        
        // Initialize an empty CSV matrix
        var csvMatrix = [[String?]](repeating: [String?](repeating: nil, count: tokenNames.count), count: tokenNames.count)
        
        // Fill CSV matrix with spotAB values
        for entry in entries {
            if let i = tokenNames.firstIndex(where: { $0 == entry.tokenA.name }),
               let j = tokenNames.firstIndex(where: { $0 == entry.tokenB.name }) {
                csvMatrix[i][j] = String(entry.spotAB)
            }
        }
        
        // Build CSV string from CSV matrix
        let csv = buildCsv(from: csvMatrix, withHeaders: tokenNames)
        
        let pasteboard = NSPasteboard.general
        pasteboard.declareTypes([.string], owner: nil)
        pasteboard.setString(csv, forType: .string)
    }
    
    private func buildCsv(from matrix: [[String?]], withHeaders headers: [String]) -> String {
        var csv = [",\(headers.joined(separator: ","))"]
        
        for (i, row) in matrix.enumerated() {
            var rowWithHeader = [headers[i]] // Add the header to the row
            rowWithHeader.append(contentsOf: row.map { $0 ?? "" }) // If no value, append an empty string
            csv.append(rowWithHeader.joined(separator: ",")) // Join each row by comma
        }
        
        return csv.joined(separator: "\n") // Join each row by new line
    }
}
#endif
