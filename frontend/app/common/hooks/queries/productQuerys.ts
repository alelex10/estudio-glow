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
 * Hook para obtener productos filtrados
 */
export function useProductsFilter(filters: {
  page?: number;
  limit?: number;
  category?: string;
  sortOrder?: string;
  sortBy?: string;
}) {
  return useQuery<PaginationResponse<Product>>({
    queryKey: productKeys.filtered(filters),
    queryFn: () =>
      productService.getProductsFilter(
        filters.page,
        filters.limit,
        filters.category,
        filters.sortOrder,
        filters.sortBy
      ),
  });
}

/**
 * Hook para obtener un producto por ID
 */
export function useProduct(id: number | string) {
  return useQuery<ResponseSchema<ProductResponse>>({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: !!id, // Solo ejecutar si hay un ID válido
  });
}

/**
 * Hook para buscar productos
 */
export function useSearchProducts(params: SearchProductParams) {
  return useQuery<Product[]>({
    queryKey: productKeys.search(params),
    queryFn: () => productService.searchProducts(params),
    enabled: !!params.q || !!params.category, // Solo buscar si hay términos
  });
}

/**
 * Hook para obtener estadísticas de productos
 */
export function useProductStats() {
  return useQuery<{
    total: number;
    lowStock: number;
    outOfStock: number;
    categories: number;
    totalValue: number;
  }>({
    queryKey: productKeys.stats(),
    queryFn: () => productService.getProductStats(),
  });
}
