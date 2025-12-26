import { useQuery } from "@tanstack/react-query";
import { productService } from "~/common/services/productService";
import type { Category } from "~/common/types/product-types";
import type { ResponseSchema } from "~/common/types/response";

/**
 * Query keys para categorías
 */
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...categoryKeys.lists(), filters] as const,
};

/**
 * Hook para obtener todas las categorías
 */
export function useCategories() {
  return useQuery<ResponseSchema<Category[]>>({
    queryKey: categoryKeys.lists(),
    queryFn: () => productService.getCategories(),
  });
}
