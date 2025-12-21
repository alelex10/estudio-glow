import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const CreateCategorySchema = z
  .object({
    name: z.string().min(1).max(100).openapi({
      example: "Electrónica",
      description: "Nombre de la categoría",
    }),
    description: z.string().max(500).optional().openapi({
      example: "Productos electrónicos y tecnológicos",
      description: "Descripción de la categoría",
    }),
  })
  .openapi("CreateCategoryRequest");

export const UpdateCategorySchema = CreateCategorySchema.partial().openapi(
  "UpdateCategoryRequest"
);

export const CategoryResponseSchema = z
  .object({
    id: z.uuid().openapi({
      example: "550e8400-e29b-41d4-a716-446655440000",
      description: "ID de la categoría",
    }),
    name: z.string().openapi({
      example: "Electrónica",
      description: "Nombre de la categoría",
    }),
    description: z.string().nullable().openapi({
      example: "Productos electrónicos y tecnológicos",
      description: "Descripción de la categoría",
    }),
    createdAt: z.date().openapi({
      example: "2024-01-15T10:30:00Z",
      description: "Fecha de creación",
    }),
    updatedAt: z.date().openapi({
      example: "2024-01-15T10:30:00Z",
      description: "Fecha de actualización",
    }),
  })
  .openapi("CategoryResponse");

export const CategoryListResponseSchema = z
  .array(CategoryResponseSchema)
  .openapi({
    description: "Lista de categorías",
  })
  .openapi("CategoryListResponse");
