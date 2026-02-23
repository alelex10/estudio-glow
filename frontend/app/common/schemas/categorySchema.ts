import { z } from "zod";

/**
 * Esquema Zod para validación de categorías
 * Usa Zod 4 con las mejores prácticas de validación
 */
export const categorySchema = z.object({
  name: z.string()
    .min(1, { error: "El nombre es requerido" })
    .max(100, { error: "El nombre no puede exceder 100 caracteres" })
    .trim(),
  
  description: z.string()
    .max(500, { error: "La descripción no puede exceder 500 caracteres" })
    .trim()
    .optional()
    .or(z.literal(""))
});

/**
 * Esquema para crear categorías (todos los campos requeridos según reglas)
 */
export const createCategorySchema = categorySchema;

/**
 * Esquema para actualizar categorías (todos los campos opcionales)
 */
export const updateCategorySchema = categorySchema.partial();

/**
 * Tipos inferidos de los esquemas Zod
 */
export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;
export type CategoryFormData = CreateCategoryFormData | UpdateCategoryFormData;
