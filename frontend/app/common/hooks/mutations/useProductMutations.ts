import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "~/common/services/productService";
import { productKeys } from "../queries/useProducts";
import type {
  Product,
  CreateProductData,
  UpdateProductData,
} from "~/common/types/product-types";

/**
 * Hook para crear un producto
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, { data: CreateProductData; image: File }>({
    mutationFn: ({ data, image }) => productService.createProduct(data, image),
    onSuccess: () => {
      // Invalidar todas las queries de productos para refrescar los datos
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Hook para actualizar un producto
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    Error,
    { id: number | string; data: UpdateProductData; image?: File }
  >({
    mutationFn: ({ id, data, image }) =>
      productService.updateProduct(id, data, image),
    onSuccess: (_, variables) => {
      // Invalidar el producto específico
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      // Invalidar todas las listas de productos
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}

/**
 * Hook para eliminar un producto
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number | string>({
    mutationFn: (id) => productService.deleteProduct(id),
    onSuccess: (_, id) => {
      // Remover el producto del cache
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      // Invalidar todas las listas de productos
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
}
