// ========== CATEGORÍAS ==========

import type { CreateCategoryFormData, UpdateCategoryFormData } from "../schemas/categorySchema";

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
 * Usa tipado inferido del esquema Zod para consistencia
 */
export type CreateCategoryData = CreateCategoryFormData;

/**
 * Datos opcionales para actualizar una categoría existente
 * Usa tipado inferido del esquema Zod para consistencia
 */
export type UpdateCategoryData = UpdateCategoryFormData;
