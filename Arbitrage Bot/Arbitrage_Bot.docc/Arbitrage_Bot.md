# Arbitrage Bot Framework

This is a high-level, efficient, and streamlined library designed to facilitate development of cryptocurrency bots. The primary goal of this framework is to automate and simplify typical tasks like monitoring market prices, identifying profitable arbitrage opportunities and executing trades accordingly.

## Features

1. **Server Management:** Includes tools to swiftly manage the WebSocket server. You can set up a server and start it with the desired port using simple function calls.

2. **Price Data Storage:** This feature allows for efficient management and access of price data. The provided Price Data Store retains up-to-date price information for various tokens, making it easier to examine and utilize this information while formulating trading strategies.

3. **Automated Trading Mecanism:** Easily perform trades by letting the system know what possible arbitrage routes you found. The system will take care of optimizing the input amount for each route, and will choose the best option.

4. **Opportunity Tracking:** An intelligent queue system handles potential arbitrage opportunities. The system can identify and store these prospects as they appear, moreover there are also facilities to process these opportunities when suitable.

## How to Use

1. Initialize your server and data store using `new_server()` and `create_store()` accordingly.
2. Set up your server with the required port using `start_server()`.
3. Use the `pipe()` function to link your server with your data store, ensuring robust data flow.
4. `get_name_for_token()` can be utilized to resolve a token name from given token address.
5. Utilize the `add_opportunity_in_queue()` function to queue any identified arbitrage opportunity, and `process_opportunities()` function to examine and action on these queued opportunities.

Here's a simple script demonstrating the library:
```c
#include "Arbitrage_Bot_Demo.h"

#define MAX_EDGES 100
// MARK: - Main
int arbitrage_main(int argc, const char * argv[]) {
    // Start the server
    Server *server = new_server();

    PriceDataStore *store = create_store();

    store->on_tick = on_tick;

    server->pipe(store);

    start_server(server, 8080);

    return 0;
}

void on_tick(const double* rates, const CToken* tokens, size_t size, size_t systemTime) { ... }
```
