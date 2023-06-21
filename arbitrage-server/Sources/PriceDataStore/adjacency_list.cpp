#include "include/adjacency_list.hpp"
#include <stdlib.h>

AdjacencyList *create_adjacency_list(int size) {
  AdjacencyList *adj_list = (AdjacencyList *)malloc(sizeof(AdjacencyList));
  adj_list->table = (Node **)calloc(size, sizeof(Node *));
  adj_list->size = size;
  return adj_list;
}

void insert_reserve_fee(AdjacencyList *adj_list, int ticker1, int ticker2,
                        ReserveFeeInfo info) {
  Node *new_node = (Node *)malloc(sizeof(Node));
  new_node->ticker = ticker2;
  new_node->info = info;
  new_node->next = adj_list->table[ticker1];
  adj_list->table[ticker1] = new_node;
}

ReserveFeeInfo *get_reserve_fee(AdjacencyList *adj_list, int ticker1,
                                int ticker2, int exchange_id) {
  Node *current = adj_list->table[ticker1];
  while (current) {
    if (current->ticker == ticker2 &&
        current->info.exchange_id == exchange_id) {
      return &current->info;
    }
    current = current->next;
  }
  return NULL;
}

void free_adjacency_list(AdjacencyList *adj_list) {
  for (int i = 0; i < adj_list->size; i++) {
    Node *current = adj_list->table[i];
    while (current) {
      Node *next = current->next;
      free(current);
      current = next;
    }
  }
  free(adj_list->table);
  free(adj_list);
}
