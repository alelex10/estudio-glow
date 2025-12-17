// ========== CATEGORÍAS ==========

/**
 * Tipo base para categoría con todos sus campos
 */
export interface Category {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Datos requeridos para crear una nueva categoría
 */
export interface CreateCategoryData {
    name: string;
    description?: string;
}

/**
 * Datos opcionales para actualizar una categoría existente
 */
export interface UpdateCategoryData {
    name?: string;
    description?: string;
}
