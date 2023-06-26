//
//  main.c
//  Arbitrage Demo
//
//  Created by Arthur Guiot on 23/06/2023.
//

#include <stdio.h>
#include <stdlib.h>
#include <semaphore.h>
#include <Arbitrage_Bot/Arbitrage_Bot.h>

int main(int argc, const char * argv[]) {
    // Start the server
    Server *server = new_server();
    
    PriceDataStore *store = create_store();
    
    server->pipe(store);
    
    start_server(server, 8080);
    
    return 0;
}
