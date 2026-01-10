import { API_ENDPOINTS } from "../config/api";
import { apiClient } from "../config/api-client";
import type { ResponseSchema } from "../types/response";
import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "../types/category-types";

/**
 * Servicio de categorías para administración
 * Maneja CRUD completo de categorías
 */
class CategoryService {
  listCategories = () =>
    apiClient<ResponseSchema<Category[]>>(API_ENDPOINTS.PUBLIC.CATEGORIES.GET);

  getCategory = (id: number | string) =>
    apiClient<Category>(`/categories/${id}`);

  createCategory = (data: CreateCategoryData) =>
    apiClient<ResponseSchema<Category>>(API_ENDPOINTS.ADMIN.CATEGORIES.CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    });

  updateCategory = (id: number | string, data: UpdateCategoryData) =>
    apiClient<Category>(API_ENDPOINTS.ADMIN.CATEGORIES.EDIT(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });

  deleteCategory = (id: number | string) =>
    apiClient<{ message: string }>(API_ENDPOINTS.ADMIN.CATEGORIES.DELETE(id), {
      method: "DELETE",
    });
}

export const categoryService = new CategoryService();
