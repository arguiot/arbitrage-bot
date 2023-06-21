#ifndef ADJACENCY_LIST_H
#define ADJACENCY_LIST_H

#include "big_integer_sign.hpp"

typedef struct {
  int exchange_id;
//  BN reserve0;
//  BN reserve1;
//  BN fee;
    double reserve0;
    double reserve1;
    double fee;
} ReserveFeeInfo;

typedef struct node {
  int ticker;
  ReserveFeeInfo info;
  struct node *next;
} Node;

typedef struct {
  Node **table;
  int size;
} AdjacencyList;

AdjacencyList *create_adjacency_list(int size);
void insert_reserve_fee(AdjacencyList *adj_list, int ticker1, int ticker2,
                        ReserveFeeInfo info);
ReserveFeeInfo *get_reserve_fee(AdjacencyList *adj_list, int ticker1,
                                int ticker2, int exchange_id);
void free_adjacency_list(AdjacencyList *adj_list);

#endif // ADJACENCY_LIST_H
