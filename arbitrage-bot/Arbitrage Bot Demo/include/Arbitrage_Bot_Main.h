//
//  Arbitrage_Bot_Demo.h
//  Arbitrage Bot Demo
//
//  Created by Arthur Guiot on 03/07/2023.
//

#include "arbitrager.h"


int arbitrage_main(int argc, const char * argv[]);
void on_tick(const double rates[], const CToken tokens[], size_t size, size_t systemTime);
