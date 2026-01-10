import { z } from "zod";

export const PaginationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1).openapi({
      example: 1,
      description: "Número de página (empieza desde 1)",
    }),
    limit: z.coerce.number().int().positive().max(100).default(10).openapi({
      example: 10,
      description: "Cantidad de productos por página (máximo 100)",
    }),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional().openapi({
      example: "desc",
      description: "Orden ascendente o descendente",
    }),
  })
  .openapi("PaginationQuery");

export const PaginatedResponseSchema = z
  .object({
    pagination: z
      .object({
        page: z.number().openapi({
          example: 1,
          description: "Página actual",
        }),
        limit: z.number().openapi({
          example: 10,
          description: "Cantidad de productos por página",
        }),
        totalItems: z.number().openapi({
          example: 100,
          description: "Total de productos disponibles",
        }),
        totalPages: z.number().openapi({
          example: 10,
          description: "Total de páginas disponibles",
        }),
        hasNextPage: z.boolean().openapi({
          example: true,
          description: "Indica si hay una página siguiente",
        }),
        hasPreviousPage: z.boolean().openapi({
          example: false,
          description: "Indica si hay una página anterior",
        }),
      })
      .openapi({
        description: "Metadatos de paginación",
      }),
  })
  .openapi("PaginatedResponse");
