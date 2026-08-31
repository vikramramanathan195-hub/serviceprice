import { queryOptions } from "@tanstack/react-query";
import { api, queryKeys } from "./api";
import type { DealStage, Region } from "./types";

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

export const dealsQueryOptions = (
  filters: { stage?: DealStage; region?: Region; search?: string } = {},
) =>
  queryOptions({
    queryKey: queryKeys.deals(filters),
    queryFn: () => api.listDeals(filters),
    staleTime: 15_000,
  });

export const dealQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.deal(id),
    queryFn: () => api.getDeal(id),
    staleTime: 5_000,
  });

export const productBomQueryOptions = (productId: string) =>
  queryOptions({
    queryKey: queryKeys.productBom(productId),
    queryFn: () => api.getProductBom(productId),
    staleTime: 60_000,
  });
