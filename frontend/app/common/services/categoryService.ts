import { API_ENDPOINTS } from "../config/api-end-points";
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
    apiClient<ResponseSchema<Category[]>>({
      endpoint: API_ENDPOINTS.PUBLIC.CATEGORIES.GET,
      options: {
        method: "GET"
      }
    });

  getCategory = (id: number | string) =>
    apiClient<Category>({
      endpoint: `/categories/${id}`,
      options: { method: "GET" }
    });

  createCategory = (data: CreateCategoryData, token?: string) =>
    apiClient<ResponseSchema<Category>>({
      endpoint: API_ENDPOINTS.ADMIN.CATEGORIES.CREATE,
      options: {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    });

  updateCategory = (id: number | string, data: UpdateCategoryData, token?: string) =>
    apiClient<Category>({
      endpoint: API_ENDPOINTS.ADMIN.CATEGORIES.EDIT(id),
      options: {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    });

  deleteCategory = (id: number | string, token?: string) =>
    apiClient<{ message: string }>({
      endpoint: API_ENDPOINTS.ADMIN.CATEGORIES.DELETE(id),
      options: {
        method: "DELETE",
      },
      token
    });
}

export const categoryService = new CategoryService();
