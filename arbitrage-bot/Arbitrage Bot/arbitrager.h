//
//  Front.h
//  Arbitrage-Bot
//
//  Created by Arthur Guiot on 23/06/2023.
//

// arbitrage.h

#ifndef FRONT_ARBITRAGE_H
#define FRONT_ARBITRAGE_H

#include <stdbool.h>
#import <Data_Aggregator/Data_Aggregator-Swift.h>

typedef struct {
    // Define your price data structure here
} PriceDataStore;

typedef struct {
    // Define your decision metadata structure here
} DecisionMetadata;

// Function pointer type for on-tick method
typedef DecisionMetadata* (*OnTickCallback)(const PriceDataStore*);

// Function pointer type for perform arbitrage method
typedef void (*PerformArbitrageCallback)(const DecisionMetadata*);

// Main function to start the server
void start_server(OnTickCallback on_tick, PerformArbitrageCallback perform_arbitrage);

#endif // FRONT_ARBITRAGE_H
