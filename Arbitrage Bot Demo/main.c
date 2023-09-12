//
//  main.c
//  Arbitrage Demo
//
//  Created by Arthur Guiot on 23/06/2023.
//

#if XCODEBUILD
#include "Arbitrage_Bot_Demo.h"
#else
#include "include/Arbitrage_Bot_Main.h"
#endif

#include "negate_log.h"
#include <math.h>
#include <stdio.h>
#include <string.h>

#ifndef DBL_MAX
#define DBL_MAX 1.7976931348623158e+308
#endif

#define MAX_EDGES 10

// MARK: - Utils
bool isValueNotInArray(int value, int *print_cycle, int size);
void reverseArray(int *a, int n);
void processArbitrage(void *dataStore, const CToken *tokens, int *arbitrageOrder, int size,
                      size_t systemTime);
void BellmanFord(const double *matrix, size_t size, int src, int *cycle, double *cycle_weight, int *cycle_length);

// MARK: - Main
int arbitrage_main(int argc, const char *argv[]) {
    // Start the server
    Server *server = new_server("botconfig.json");
    
    PriceDataStore *store = create_store();
    
    store->on_tick = on_tick;
    
    server->pipe(store);
    
    start_server(server, 8080);
    
    return 0;
}

#if XCODEBUILD
#else
int main(int argc, const char *argv[]) { arbitrage_main(argc, argv); }
#endif

// For DEBUG
void print_kernel(double *kernel, int size, const CToken *tokens, void *dataStore) {
    // Print the weight kernel
    printf(",");
    for (int j = 0; j < size; j++) {
        char *name = NULL;
        get_name_for_token(dataStore, tokens[j].address, &name);
        printf("%s", name);
        if (j < size - 1) {
            printf(",");
        }
    }
    printf("\n");
    
    for (int i = 0; i < size; i++) {
        char *name = NULL;
        get_name_for_token(dataStore, tokens[i].address, &name);
        printf("%s,", name);
        
        for (int j = 0; j < size; j++) {
            printf("%f", kernel[(i*size) + j]);
            if (j < size - 1) {
                printf(",");
            }
        }
        printf("\n");
    }
}

void on_tick(void *dataStore, const double *rates, const CToken *tokens, size_t size,
             size_t systemTime) {
    size_t rateSize = size * size;
    
    // Let's get the weights
    double weights[rateSize];
    
    calculate_neg_log(rates, weights, (int)rateSize);
    
    print_kernel(rates, size, tokens, dataStore);
    
    int src = 0; // Source vertex as 0
    int cycle[size * 2]; // Adjust the size to accommodate the two extra elements.
    double cycle_weight; // Create a new array to store weights
    int cycle_length;
    BellmanFord(weights, size, src, cycle, &cycle_weight, &cycle_length); // Start from the second index
    
    if (cycle_weight > 0 || cycle_length <= 3 || cycle[0] != src) {
        return;
    }
    
    printf("Cycle: ");
    for (int i = 0; i < cycle_length; ++i) {
        printf("%d (%.2f) ", cycle[i], cycle_weight);
    }
    printf("\n");
    
    processArbitrage(dataStore, tokens, cycle, cycle_length, systemTime);
    
    process_opportunities(dataStore, systemTime);
}


// MARK: - Bellman Ford
void convert_matrix_to_edgelist(const double *matrix, size_t size,
                                double (*edge_list)[3]) {
    int k = 0;
    for (int i = 0; i < size; ++i) {
        for (int j = 0; j < size; ++j) {
            edge_list[k][0] = i;
            edge_list[k][1] = j;
            double w = matrix[i * size + j];
            edge_list[k][2] = isinf(w) ? INFINITY : w;
            k++;
        }
    }
}

void BellmanFord(const double* matrix, size_t size, int src, int* cycle, double* cycle_weight, int* cycle_length)
{
    double distance[size];
    int predecessor[size];
    *cycle_weight = 0;
    
    for (int i = 0; i < size; i++) {
        distance[i] = DBL_MAX;
        predecessor[i] = -1;
    }
    distance[src] = 0;
    
    for (int i = 1; i <= size - 1; i++) {
        for (int j = 0; j < size; j++) {
            for (int k = 0; k < size; k++) {
                double weight = matrix[j * size + k];
                if (weight == -INFINITY) {
                    weight = INFINITY;
                }
                
                if (weight != 0 && distance[j] != DBL_MAX && distance[j] + weight < distance[k]) {
                    distance[k] = distance[j] + weight;
                    predecessor[k] = j;
                }
            }
        }
    }
    
    for (int j = 0; j < size; j++) {
        for (int k = 0; k < size; k++) {
            double weight = matrix[j * size + k];
            if (weight != 0 && weight != -INFINITY  && distance[j] != DBL_MAX && distance[j] + weight < distance[k]) {
                
                // Find the cycle
                bool visited[size];
                memset(visited, false, sizeof(visited));
                int cycle_vertix = k;
                do {
                    if (visited[cycle_vertix]) {
                        break;
                    }
                    visited[cycle_vertix] = true;
                    cycle_vertix = predecessor[cycle_vertix];
                } while (cycle_vertix != k);
                
                // Add cycle vertices to 'temp_cycle' array - in reverse order
                int cycle_length_local = 0;
                int temp_cycle[size];
                for (int s = 0; s < size; ++s) {
                    if(visited[s]) {
                        temp_cycle[cycle_length_local] = s;
                        cycle_length_local++;
                    }
                }
                
                // Check for edge from src to first node and from last node to src
                if (matrix[src*size + temp_cycle[cycle_length_local - 1]] != 0 && matrix[temp_cycle[0]*size + src] != 0) {
                    // Copy temp_cycle into cycle in reverse order
                    for (int p = 0; p < cycle_length_local; p++) {
                        cycle[p] = temp_cycle[cycle_length_local - p - 1];
                    }
                    
                    // Now the first and last nodes are src
                    if (cycle[0] != src) {
                        for (int p = cycle_length_local; p > 0; p--) {
                            cycle[p] = cycle[p-1];
                        }
                        cycle[0] = src;
                        cycle_length_local++;
                    }
                    
                    if (cycle[cycle_length_local - 1] != src) {
                        cycle[cycle_length_local] = src;
                        cycle_length_local++;
                    }
                    
                    // Calculate cycle weight
                    double cycle_weight_local = 0;
                    for (int p = 0; p < cycle_length_local - 1; ++p) {
                        cycle_weight_local += matrix[cycle[p]*size + cycle[p+1]];
                    }
                    
                    if (cycle_weight_local < *cycle_weight) {
                        *cycle_weight = cycle_weight_local;
                        *cycle_length = cycle_length_local;
                    }
                }
            }
        }
    }
}

void dfs(const double* matrix, size_t size, int current, int start, double weightSoFar, int* path, int* pathLength, bool* visiting, int* minCycle, double* minCycleWeight, int* minCycleLength) {
    if (*pathLength >= MAX_EDGES) {
        // Stop searching when reaching the max cycle length
        return;
    }
    
    path[*pathLength] = current;
    (*pathLength)++;
    visiting[current] = true;
    
    for (int next = 0; next < size; ++next) {
        double weight = matrix[current * size + next];
        if (weight != 0) {
            if (!visiting[next]) {
                dfs(matrix, size, next, start, weightSoFar + weight, path, pathLength, visiting, minCycle, minCycleWeight, minCycleLength);
            } else if (next == start) {
                if (weightSoFar + weight < *minCycleWeight) {
                    memcpy(minCycle, path, (*pathLength)*sizeof(int));
                    *minCycleWeight = weightSoFar + weight;
                    *minCycleLength = *pathLength;
                }
            }
        }
    }
    
    (*pathLength)--;
    visiting[current] = false;
}


void FindMostNegativeCycleDFS(const double* matrix, size_t size, int src, int* cycle, double* cycle_weight, int* cycle_length)
{
    int path[size];
    bool visiting[size];
    memset(path, 0, sizeof(path));
    memset(visiting, false, sizeof(visiting));
    
    *cycle_weight = DBL_MAX;
    *cycle_length = 0;
    int pathLength = 0;
    dfs(matrix, size, src, src, 0, path, &pathLength, visiting, cycle, cycle_weight, cycle_length);
}


// MARK: - Utils

bool isValueNotInArray(int value, int *print_cycle, int size) {
    for (int i = 0; i < size; i++) {
        if (print_cycle[i] == value)
            return false;
    }
    return true;
}
void reverseArray(int *a, int n) {
    int c, t;
    for (c = 0; c < n / 2; c++) {
        t = a[c];
        a[c] = a[n - c - 1];
        a[n - c - 1] = t;
    }
}

void processArbitrage(void *dataStore, const CToken *tokens, int *arbitrageOrder, int size,
                      size_t systemTime) {
    int i;
    
    add_opportunity_in_queue(dataStore, arbitrageOrder, size, systemTime);
    
    printf("Arbitrage Opportunity detected: \n\n");
    for (int i = 0; i < size; i++) {
        char *name = NULL;
        get_name_for_token(dataStore, tokens[arbitrageOrder[i]].address, &name);
        
        printf("%s", name);
        
        free(name);
        
        if (size > i + 1)
            printf(" -> "); // Print arrow only n-1 times
    }
    printf("\n");
    printf("_______________________________\n\n\n");
}
