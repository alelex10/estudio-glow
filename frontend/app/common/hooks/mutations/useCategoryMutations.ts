import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "~/common/services/categoryService";
import { categoryKeys } from "../queries/useCategories";
import { productKeys } from "../queries/useProducts";
import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "~/common/types/category-types";
import type { ResponseSchema } from "~/common/types/response";

/**
 * Hook para crear una categoría
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation<ResponseSchema<Category>, Error, CreateCategoryData>({
    mutationFn: (data) => categoryService.createCategory(data),
    onSuccess: () => {
      // Invalidar todas las queries de categorías
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      // También invalidar productos ya que pueden tener relación con categorías
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Hook para actualizar una categoría
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation<
    Category,
    Error,
    { id: number | string; data: UpdateCategoryData }
  >({
    mutationFn: ({ id, data }) => categoryService.updateCategory(id, data),
    onSuccess: () => {
      // Invalidar todas las categorías
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      // Invalidar productos ya que pueden mostrar el nombre de categoría actualizado
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Hook para eliminar una categoría
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number | string>({
    mutationFn: (id) => categoryService.deleteCategory(id),
    onSuccess: () => {
      // Invalidar todas las categorías
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      // Invalidar productos ya que pueden estar afectados
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
