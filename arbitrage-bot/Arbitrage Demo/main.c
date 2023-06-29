//
//  main.c
//  Arbitrage Demo
//
//  Created by Arthur Guiot on 23/06/2023.
//

#include <Arbitrage_Bot/Arbitrage_Bot.h>
#include "negate_log.h"
#include <stdio.h>
#include <math.h>

#define MAX_EDGES 100

void on_tick(const double* rates, const CToken* tokens, int size);
// MARK: - Utils
bool isValueNotInArray(int value, int *print_cycle);
void reverseArray(int *a, int n);
void printArbitrage(const CToken* tokens, int *arbitrageOrder, int size);

// MARK: - Main
int main(int argc, const char * argv[]) {
    // Start the server
    Server *server = new_server();
    
    PriceDataStore *store = create_store();
    
    store->on_tick = on_tick;
    
    server->pipe(store);
    
    start_server(server, 8080);
    
    return 0;
}

void on_tick(const double* rates, const CToken* tokens, int size) {
    
    int sourceIndex = 0;    // Could start with any source vertex
    
    int rateSize = size * size;
    // Let's get the weights
    double weights[rateSize];
    double edges[rateSize];
    int predecessor[rateSize];
    
    calculate_neg_log(rates, weights, rateSize);
    
    // Step 2: Initialize distances from src to all other vertices as infinite
    for (int i = 0; i < size; i++) edges[i] = INFINITY;
    edges[sourceIndex] = 0;
    
    // Step 3: Initialize pre with -1 for n records
    for (int i = 0; i < size; i++) predecessor[i] = -1;
    

    // Step 4: Relax Edges |vertices-1| times
    for (int i = 0; i <= (size - 1); i++) {
        for (int j = 0; j < size; j++) { // current source vertex
            for (int k = 0; k < size; k++) { // current destination vertex
                if (edges[k] > edges[j] + weights[j * size + k]) {
                    edges[k] = edges[j] + weights[j * size + k];
                    predecessor[k] = j;
                }
            }
        }
    }
    
    // Step 5: If we can still Relax Edges then we have a negative cycle -> Exploitation possibility
    for (int i = 0; i < size; i++) {
        int currentI = i;
        for (int j = 0; j < size; j++) {
            // Checks if negative cycle exists, and use the predecessor array to print the arbitrage order
            if (edges[j] > edges[i] + weights[i * size + j]) {
                // Allocate arbitrage Order Array
                int arbitrageOrder[MAX_EDGES];
                for (int p = 0; p < MAX_EDGES; p++) arbitrageOrder[p] = -1;
                
                // Push i & j to arbitrage Order Array
                int counter = 0;
                arbitrageOrder[counter] = j; counter++;
                arbitrageOrder[counter] = i; counter++;
                
                // Iterating backwards starting from the source vertex till source vertex is encountered again
                // or vertex is already in arbitrage Order
                while ((isValueNotInArray(predecessor[i], arbitrageOrder))) {
                    arbitrageOrder[counter] = predecessor[i];
                    i = predecessor[i];
                    counter++;
                }
                
                // Add the last vertex
                arbitrageOrder[counter] = predecessor[i];
                counter++;
                printArbitrage(tokens, arbitrageOrder, counter);
            }
        }
        i = currentI;
    }
}


bool isValueNotInArray(int value, int *print_cycle) {
    for (int i = 0; i < 6; i++)
    {
        if (print_cycle[i] == value)
            return false;
    }
    return true;
}
void reverseArray(int *a, int n) {
    int c, t;
    for (c = 0; c < n / 2; c++)
    {
        t = a[c];
        a[c] = a[n - c - 1];
        a[n - c - 1] = t;
    }
}

void printArbitrage(const CToken* tokens, int *arbitrageOrder, int size) {
    int i;
    reverseArray(arbitrageOrder, size);
    
    printf("Arbitrage Opportunity detected: \n\n");
    for (i = 0; i < size; i++)
    {
        printf("%s", tokens[arbitrageOrder[i]].name);
        if (size > i + 1) printf(" -> "); // Print arrow only n-1 times
    }
    printf("\n");
    printf("_______________________________\n\n\n");
}
