//
//  main.c
//  Arbitrage Demo
//
//  Created by Arthur Guiot on 23/06/2023.
//

#include <stdio.h>
#include <semaphore.h>
#include <Arbitrage_Bot/Arbitrage_Bot.h>

int main(int argc, const char * argv[]) {
    // Start the server
    start_server();
    
    wait_for_tasks_to_complete();
    
    return 0;
}
