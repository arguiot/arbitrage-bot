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
// Main function to start the server
typedef struct {
    const char *name;
    const unsigned char *address; // UInt8
} CToken;

// Server system
typedef struct {
    void *wrapper;
    void (*on_tick)(const double* rates, const CToken* tokens, size_t size);
} PriceDataStore;

typedef struct {
    PriceDataStore *dataStore;
    void *app;
    void (*pipe)(PriceDataStore *dataStore);
} Server;

Server *new_server(void);
PriceDataStore *create_store(void);
void start_server(Server *server, int port);

#endif // FRONT_ARBITRAGE_H
