import { queryOptions } from "@tanstack/react-query";
import { api, queryKeys } from "./api";

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.products,
    queryFn: () => api.listProducts(),
    staleTime: 60_000,
  });

export const healthQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.health,
    queryFn: () => api.getHealth(),
    refetchInterval: 5_000,
    staleTime: 0,
  });
