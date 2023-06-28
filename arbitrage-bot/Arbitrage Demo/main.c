//
//  main.c
//  Arbitrage Demo
//
//  Created by Arthur Guiot on 23/06/2023.
//

#include <Arbitrage_Bot/Arbitrage_Bot.h>
#include <stdio.h>
#include <math.h>

void on_tick(const double* rates, int size);

int main(int argc, const char * argv[]) {
    // Start the server
    Server *server = new_server();
    
    PriceDataStore *store = create_store();
    
    store->on_tick = on_tick;
    
    server->pipe(store);
    
    start_server(server, 8080);
    
    return 0;
}

void on_tick(const double* rates, int size) {
    // Get the size of the square matrix
    int squareSize = (int) sqrt((double)size);
    
    // Loop over each index in the rates array
    for (int i = 0; i < size; i++) {
        // Print the current rate followed by a comma
        printf("%f", rates[i]);
        
        // If we're at the end of a row, print a newline, else print a comma
        if ((i+1) % squareSize == 0) {
            printf("\n");
        } else {
            printf(",");
        }
    }
}
