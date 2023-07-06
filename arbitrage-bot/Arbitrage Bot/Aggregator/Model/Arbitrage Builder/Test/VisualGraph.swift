//
//  VisualGraph.swift
//  Arbitrage Bot
//
//  Created by Arthur Guiot on 04/07/2023.
//

#if DEBUG
#if canImport(SVGRenderer)
import Foundation
import Euler
import SwiftPlot
import SVGRenderer
import AppKit


extension BuilderStep {
    func drawGraph() {
        func f(_ x: BN) throws -> BN {
            let a = try self.price(for: x.cash).0
            let b = try self.price(for: (x + 1).cash).0
            
            let dev = BN(cash: b - a) / 1
            
            return dev - 1
        }
        
        func price(_ x: Double) -> Double {
            let p = try! self.price(for: BN(x).cash).0
            return BN(cash: p).asDouble() ?? 0
        }
        
        func dev1(_ x: Double) -> Double {
            return try! f(BN(x)).asDouble() ?? 0
        }
        
        func dev2(_ x: Double) -> Double {
            let u = (dev1(x) + dev1(x + 0.1)) / 0.1
            return max(-(u - 1), 0)
        }
        
        let renderer = SVGRenderer()
        var lineGraph = LineGraph<Double, Double>(enablePrimaryAxisGrid: true)
        lineGraph.addFunction(dev1, minX: 10.0, maxX: 200.0, numberOfSamples: 1000, clampY: 0...10, label: "Dev1", color: .orange, axisType: .secondaryAxis)
        lineGraph.addFunction(dev2, minX: 10.0, maxX: 200.0, numberOfSamples: 1000, clampY: 0...10, label: "Dev2", color: .red, axisType: .secondaryAxis)
        lineGraph.addFunction(price, minX: 10.0, maxX: 200.0, numberOfSamples: 1000, clampY: 0...50000, label: "Price", color: .blue)
        lineGraph.plotTitle.title = "FUNCTION"
        lineGraph.plotLabel.xLabel = "X-AXIS"
        lineGraph.plotLabel.yLabel = "Y-AXIS"
        lineGraph.drawGraph(renderer: renderer)
        let image = renderer.svg
        // Save using FileManager
        let fileManager = FileManager.default
        let homeDirectory = fileManager.homeDirectoryForCurrentUser
        let url = homeDirectory.appendingPathComponent("Downloads/Plot.svg")
        let data = image.data(using: .utf8)
        // Write the PNG representation to disk
        try! data?.write(to: url)
    }
}

#endif
#endif
