// Stock or sales changed: everything that shows stock, totals or history is stale.
export function invalidateStock(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["products"] });
  queryClient.invalidateQueries({ queryKey: ["product"] });
  queryClient.invalidateQueries({ queryKey: ["productSearch"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function invalidateSales(queryClient) {
  invalidateStock(queryClient);
  queryClient.invalidateQueries({ queryKey: ["sales"] });
  queryClient.invalidateQueries({ queryKey: ["sale"] });
}
