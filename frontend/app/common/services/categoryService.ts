import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
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
    private baseUrl = API_BASE_URL;

    /**
     * Obtener todas las categorías
     */
    async listCategories(): Promise<ResponseSchema<Category[]>> {
        const response = await fetch(
            `${this.baseUrl}${API_ENDPOINTS.PUBLIC.CATEGORIES.GET}`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error al obtener categorías");
        }

        return response.json();
    }

    /**
     * Obtener una categoría por ID
     */
    async getCategory(id: number | string): Promise<Category> {
        const response = await fetch(
            `${this.baseUrl}/categories/${id}`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error al obtener categoría");
        }

        return response.json();
    }

    /**
     * Crear una nueva categoría
     */
    async createCategory(data: CreateCategoryData): Promise<ResponseSchema<Category>> {
        const response = await fetch(
            `${this.baseUrl}${API_ENDPOINTS.ADMIN.CATEGORIES.CREATE}`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error al crear categoría");
        }

        return response.json();
    }

    /**
     * Actualizar una categoría existente
     */
    async updateCategory(
        id: number | string,
        data: UpdateCategoryData
    ): Promise<Category> {
        const response = await fetch(
            `${this.baseUrl}${API_ENDPOINTS.ADMIN.CATEGORIES.EDIT(id)}`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error al actualizar categoría");
        }

        return response.json();
    }

    /**
     * Eliminar una categoría
     */
    async deleteCategory(id: number | string): Promise<{ message: string }> {
        const response = await fetch(
            `${this.baseUrl}${API_ENDPOINTS.ADMIN.CATEGORIES.DELETE(id)}`,
            {
                method: "DELETE",
                credentials: "include",
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Error al eliminar categoría");
        }

        return response.json();
    }
}

export const categoryService = new CategoryService();
