//
//  Front.h
//  Arbitrage-Bot
//
//  Created by Arthur Guiot on 23/06/2023.
//
// This header file defines the data structures and key functions for our Arbitrage bot.

#ifndef FRONT_ARBITRAGE_H
#define FRONT_ARBITRAGE_H

#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

/// CToken is a structure representing a Digital Token used in arbitrage operations.
/// @field index An integer acting as an unique identifier for the token.
/// @field address Unsigned character pointer representing the token's address.
typedef struct {
    const int index;
    const unsigned char * _Nonnull address;
} CToken;

/// Fetches the name associated with a specific token address.
/// @param tokenAddress (_Nonnull uint8_t*) The token address used to lookup the token name.
/// @param result (_Nonnull char*) The pointer where the result string (token name) will be written.
void get_name_for_token(const uint8_t * _Nonnull tokenAddress, char * _Nonnull result);

/// PriceDataStore is a structure representing a system containing different token rates.
/// @field wrapper Generic pointer representing the system wrapper.
/// @field on_tick Function pointer to be executed on each tick.
/// The function must include the rates, tokens, size of tokens and system time as parameters.
/// @seealso CToken
typedef struct {
    void * _Nonnull wrapper;
    void (* _Nonnull on_tick)(const double* _Nonnull rates,
                              const CToken* _Nonnull tokens,
                              size_t size,
                              size_t systemTime);
} PriceDataStore;

/// Enqueue a detected arbitrage opportunity order for further processing.
/// @param order (_Nonnull int*) Order to be added in the queue.
/// @param size (size_t) Size of the order.
/// @param systemTime (size_t) System time when the opportunity was detected.
void add_opportunity_in_queue(int * _Nonnull order, size_t size, size_t systemTime);

/// Process the current opportunities in the queue.
/// @param systemTime (size_t) System time when this function is executed.
void process_opportunities(size_t systemTime);

/// Server is a structure representing the arbitrage bot server.
/// @field dataStore (_Nonnull PriceDataStore*) Instance of the PriceDataStore.
/// @field app (_Nonnull void*) Generic pointer representing application-specific data.
/// @field pipe (_Nonnull function) A function pointer executed to pipe the PriceDataStore.
/// @seealso PriceDataStore
typedef struct {
    PriceDataStore * _Nonnull dataStore;
    void * _Nonnull app;
    void (* _Nonnull pipe)(PriceDataStore * _Nonnull dataStore);
} Server;

/// Creates the server.
/// @discussion Allocates memory and sets up basic server parameters.
/// @return (_Nonnull Server*) Pointer to the created server.
Server * _Nonnull new_server(void);

/// Creates a new PriceDataStore.
/// @discussion Allocates memory and sets up basic parameters for the PriceDataStore.
/// @return (_Nonnull PriceDataStore*) Pointer to the created PriceDataStore.
PriceDataStore * _Nonnull create_store(void);

/// Starts the server on a specific port.
/// @param server (_Nonnull Server*) The server to be started.
/// @param port (int) The port number on which the server should listen.
void start_server(Server * _Nonnull server, int port);

#endif // FRONT_ARBITRAGE_H
