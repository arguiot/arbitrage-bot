//
//  File.swift
//  
//
//  Created by Arthur Guiot on 20/06/2023.
//

import Foundation

class PriceDataFeedController<T> {
    actor PriceDataFeed<Meta> {
        var pair: PairInfo
        var latestQuote: Quote<Meta>
        
        init(pair: PairInfo, quote: Quote<Meta>) {
            self.pair = pair
            self.latestQuote = quote
        }
    }
    
    var feeds = Dictionary<PairInfo, PriceDataFeed<T>>()
    
    
}
