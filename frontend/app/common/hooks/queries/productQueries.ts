import { queryOptions, useQuery } from "@tanstack/react-query";
import { productService } from "~/common/services/productService";
import type {
  Product,
  ProductResponse,
  SearchProductParams,
} from "~/common/types/product-types";
import type {
  PaginationResponse,
  ResponseSchema,
} from "~/common/types/response";
import { contextProvider, tokenContext } from "~/common/context/context";

/**
 * Query keys para productos
 */
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number | string) => [...productKeys.details(), id] as const,
  new: () => [...productKeys.all, "new"] as const,
  stats: () => [...productKeys.all, "stats"] as const,
  paginated: (page: number, limit: number) =>
    [...productKeys.lists(), { page, limit }] as const,
  filtered: (filters: {
    page?: number;
    limit?: number;
    category?: string;
    sortOrder?: string;
    sortBy?: string;
  }) => [...productKeys.lists(), "filtered", filters] as const,
  search: (params: SearchProductParams) =>
    [...productKeys.lists(), "search", params] as const,
};

/**
 * Hook para obtener productos nuevos
 */
export const newProductsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => productService.getNewProducts(),
  });

/**
 * Hook para obtener productos paginados
 */
export function useProductsPaginated(page: number = 1, limit: number = 10) {
  return useQuery<PaginationResponse<ProductResponse>>({
    queryKey: productKeys.paginated(page, limit),
    queryFn: () => productService.getProductsPaginated(page, limit),
  });
}

/**
 * Query options para productos paginados (para SSR)
 */
export function productPaginatedQuery(page: number = 1, limit: number = 10, token?: string) {
  return queryOptions({
    queryKey: productKeys.paginated(page, limit),
    queryFn: () => productService.getProductsPaginated(page, limit),
    enabled: true,
  });
}


/**
 * Hook para obtener un producto por ID
 */
export function useProduct(id: number | string) {
  return useQuery<ResponseSchema<ProductResponse>>({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
  });
}

/**
 * Hook para buscar productos
 */
export function useSearchProducts(params: SearchProductParams) {
  return useQuery<Product[]>({
    queryKey: productKeys.search(params),
    queryFn: () => productService.searchProducts(params),
    enabled: !!params.q || !!params.category,
  });
}

/**
 * Hook para obtener estadísticas de productos (cliente)
 */
export function useProductStats() {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: () => {
      const token = contextProvider.get(tokenContext);
      if (!token) throw new Error("Token de autenticación requerido");
      return productService.getProductStats(token);
    },
    enabled: !!contextProvider.get(tokenContext),
  });
}

/**
 * Query options para estadísticas de productos (para SSR)
 */
export const productStatsQuery = (token?: string) =>
  queryOptions({
    queryKey: productKeys.stats(),
    queryFn: () => {
      if (!token) throw new Error("Token de autenticación requerido para SSR");
      return productService.getProductStats(token);
    },
    enabled: !!token,
  });
