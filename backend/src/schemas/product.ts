import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const CreateProductSchema = z
  .object({
    name: z.string().min(1).max(255).openapi({
      example: "Laptop Gaming",
      description: "Nombre del producto",
    }),
    description: z.string().max(500).optional().openapi({
      example: "Laptop de alto rendimiento para gaming",
      description: "Descripción del producto",
    }),
    price: z.coerce.number().positive().openapi({
      example: 1500.99,
      description: "Precio del producto",
    }),
    stock: z.coerce.number().int().min(0).openapi({
      example: 50,
      description: "Cantidad en stock",
    }),
    categoryId: z.coerce.number().int().positive().openapi({
      example: 1,
      description: "ID de la categoría del producto",
    }),
    image: z.any().openapi({
      type: "string",
      format: "binary",
      description: "Imagen del producto",
    }),
  })
  .openapi("CreateProductRequest");

export const UpdateProductSchema = CreateProductSchema.partial().openapi(
  "UpdateProductRequest"
);

export const ProductResponseSchema = z
  .object({
    id: z.number().openapi({
      example: 1,
      description: "ID del producto",
    }),
    name: z.string().openapi({
      example: "Laptop Gaming",
      description: "Nombre del producto",
    }),
    description: z.string().nullable().openapi({
      example: "Laptop de alto rendimiento para gaming",
      description: "Descripción del producto",
    }),
    price: z.number().openapi({
      example: 1500.99,
      description: "Precio del producto",
    }),
    stock: z.number().openapi({
      example: 50,
      description: "Cantidad en stock",
    }),
    category: z
      .object({
        id: z.number().openapi({
          example: 1,
          description: "ID de la categoría",
        }),
        name: z.string().openapi({
          example: "Electrónica",
          description: "Nombre de la categoría",
        }),
      })
      .openapi({
        example: {
          id: 1,
          name: "Electrónica",
        },
        description: "Categoría del producto",
      }),
    imageUrl: z.string().nullable().openapi({
      example: "https://example.com/image.jpg",
      description: "URL de la imagen del producto",
    }),
    createdAt: z.string().datetime().openapi({
      example: "2024-01-15T10:30:00Z",
      description: "Fecha de creación",
    }),
    updatedAt: z.string().datetime().openapi({
      example: "2024-01-15T10:30:00Z",
      description: "Fecha de actualización",
    }),
  })
  .openapi("ProductResponse");

export const ProductListResponseSchema = z
  .object({
    products: z.array(ProductResponseSchema).openapi({
      description: "Lista de productos",
    }),
  })
  .openapi("ProductListResponse");

export const SearchProductSchema = z
  .object({
    q: z.string().min(1).optional().openapi({
      example: "laptop",
      description: "Término de búsqueda",
    }),
    categoryId: z.coerce.number().int().positive().optional().openapi({
      example: 1,
      description: "Filtrar por ID de categoría",
    }),
    minPrice: z.coerce.number().positive().optional().openapi({
      example: 100,
      description: "Precio mínimo",
    }),
    maxPrice: z.coerce.number().positive().optional().openapi({
      example: 2000,
      description: "Precio máximo",
    }),
  })
  .openapi("SearchProductRequest");

// Schema para paginación
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
    sortBy: z
      .enum(["name", "price", "createdAt", "stock"])
      .default("createdAt")
      .optional()
      .openapi({
        example: "createdAt",
        description: "Campo por el cual ordenar",
      }),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional().openapi({
      example: "desc",
      description: "Orden ascendente o descendente",
    }),
  })
  .openapi("PaginationQuery");

// Schema de respuesta paginada
export const PaginatedProductsResponseSchema = z
  .object({
    data: z.array(ProductResponseSchema).openapi({
      description: "Lista de productos de la página actual",
    }),
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
  .openapi("PaginatedProductsResponse");

export const FilterProductsSchema = z
  .object({
    categoryId: z.coerce.number().optional().openapi({
      example: 1,
      description: "ID de la categoría del producto",
    }),
  })
  .extend(PaginationQuerySchema.shape)
  .openapi("FilterProductsRequest");

// Tipos TypeScript exportados
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type PaginatedProductsResponse = z.infer<
  typeof PaginatedProductsResponseSchema
>;
export type FilterProducts = z.infer<typeof FilterProductsSchema>;
