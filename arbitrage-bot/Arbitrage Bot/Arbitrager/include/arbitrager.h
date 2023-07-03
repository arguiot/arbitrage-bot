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
#include <stdint.h>
#include <stdlib.h>
// Main function to start the server
typedef struct {
    const int index;
    const unsigned char * _Nonnull address; // UInt8
} CToken;

void get_name_for_token(const uint8_t * _Nonnull tokenAddress, char * _Nonnull result);

// Server system
typedef struct {
    void * _Nonnull wrapper;
    void (* _Nonnull on_tick)(const double* _Nonnull rates,
                              const CToken* _Nonnull tokens,
                              size_t size,
                              size_t systemTime);
} PriceDataStore;

void add_opportunity_in_queue(int * _Nonnull order, size_t size, size_t systemTime);
void process_opportunities(void);

typedef struct {
    PriceDataStore * _Nonnull dataStore;
    void * _Nonnull app;
    void (* _Nonnull pipe)(PriceDataStore * _Nonnull dataStore);
} Server;

Server * _Nonnull new_server(void);
PriceDataStore * _Nonnull create_store(void);
void start_server(Server * _Nonnull server, int port);

#endif // FRONT_ARBITRAGE_H
