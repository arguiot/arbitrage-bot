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
// Main function to start the server

// Server system
typedef struct {
    void *wrapper;
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
