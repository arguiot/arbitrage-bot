//
//  Arbitrage_Bot_Demo.h
//  Arbitrage Bot Demo
//
//  Created by Arthur Guiot on 03/07/2023.
//

#include <Arbitrage_Bot/Arbitrage_Bot.h>

int arbitrage_main(int argc, const char * argv[]);
void on_tick(void *dataStore, const double *rates, const CToken *tokens, size_t size, size_t systemTime);
#if DEBUG
void BellmanFord(const double *matrix, size_t size, int src, int *cycle, double *cycle_weight, int *cycle_length);
void FindMostNegativeCycleDFS(const double *matrix, size_t size, int src, int *cycle, double *cycle_weight, int *cycle_length);
void calculate_neg_log(const double* in_data, double* out_data, int count);
#endif
