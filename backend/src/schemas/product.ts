import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { PaginationQuerySchema } from "./common/paginated";

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
    categoryId: z.uuid().openapi({
      example: "550e8400-e29b-41d4-a716-446655440000",
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

export const ProductBaseSchema = z.object({
  id: z.uuid().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
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
  categoryId: z.uuid().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ID de la categoría del producto",
  }),
});

export const ProductWithCategoryResponseSchema = z
  .object({
    id: z.uuid().openapi({
      example: "550e8400-e29b-41d4-a716-446655440000",
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
        id: z.uuid().openapi({
          example: "550e8400-e29b-41d4-a716-446655440000",
          description: "ID de la categoría",
        }),
        name: z.string().openapi({
          example: "Electrónica",
          description: "Nombre de la categoría",
        }),
      })
      .openapi({
        example: {
          id: "550e8400-e29b-41d4-a716-446655440000",
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
    products: z.array(ProductWithCategoryResponseSchema).openapi({
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
    categoryId: z.string().uuid().optional().openapi({
      example: "550e8400-e29b-41d4-a716-446655440000",
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
export const PaginationProductQuerySchema = z
  .object({
    sortBy: z
      .enum(["name", "price", "createdAt", "stock"])
      .default("createdAt")
      .optional()
      .openapi({
        example: "createdAt",
        description: "Campo por el cual ordenar",
      }),
  })
  .safeExtend(PaginationQuerySchema.shape)
  .openapi("PaginationQuery");

// Schema de respuesta paginada
export const PaginatedProductsResponseSchema = z
  .object({
    data: z.array(ProductWithCategoryResponseSchema).openapi({
      description: "Lista de productos de la página actual",
    }),
    pagination: PaginationQuerySchema,
  })
  .openapi("PaginatedProductsResponse");

export const FilterProductsSchema = z
  .object({
    categoryId: z.uuid().optional().openapi({
      example: "550e8400-e29b-41d4-a716-446655440000",
      description: "ID de la categoría del producto",
    }),
  })
  .extend(PaginationProductQuerySchema.shape)
  .openapi("FilterProductsRequest");

export const GetNewProductsSchema = z.array(ProductBaseSchema);

// Tipos TypeScript exportados
export type PaginationQuery = z.infer<typeof PaginationProductQuerySchema>;
export type ProductResponse = z.infer<typeof ProductWithCategoryResponseSchema>;
export type GetNewProducts = z.infer<typeof GetNewProductsSchema>;
export type PaginatedProductsResponse = z.infer<
  typeof PaginatedProductsResponseSchema
>;
export type FilterProducts = z.infer<typeof FilterProductsSchema>;
