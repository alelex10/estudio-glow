import { registry } from "./registry";
import { z } from "zod";
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductWithCategoryResponseSchema,
  ProductListResponseSchema,
  SearchProductSchema,
  PaginationQuerySchema,
  PaginatedProductsResponseSchema,
  ErrorResponseSchema,
  AuthResponseSchema,
  FilterProductsSchema,
  ProductBaseSchema,
} from "../schemas";
import { ResponseSchema } from "../schemas/response";

// Product endpoints (Admin)
registry.registerPath({
  method: "get",
  path: "/products",
  tags: ["Products (Admin)"],
  responses: {
    200: {
      description: "Lista de productos",
      content: {
        "application/json": {
          schema: ProductListResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "get",
  path: "/products/{id}",
  tags: ["Products (Admin)"],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "1",
        description: "ID del producto",
      }),
    }),
  },
  responses: {
    200: {
      description: "Producto encontrado",
      content: {
        "application/json": {
          schema: ProductWithCategoryResponseSchema,
        },
      },
    },
    404: {
      description: "Producto no encontrado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "post",
  path: "/products",
  tags: ["Products (Admin)"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: CreateProductSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Producto creado exitosamente",
      content: {
        "application/json": {
          schema: ProductWithCategoryResponseSchema,
        },
      },
    },
    400: {
      description: "Error en la solicitud",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Error del servidor",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "put",
  path: "/products/{id}",
  tags: ["Products (Admin)"],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "1",
        description: "ID del producto",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateProductSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Producto actualizado exitosamente",
      content: {
        "application/json": {
          schema: ProductWithCategoryResponseSchema,
        },
      },
    },
    404: {
      description: "Producto no encontrado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    400: {
      description: "Error en la solicitud",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "delete",
  path: "/products/{id}",
  tags: ["Products (Admin)"],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "1",
        description: "ID del producto",
      }),
    }),
  },
  responses: {
    200: {
      description: "Producto eliminado exitosamente",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
    404: {
      description: "Producto no encontrado",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// Public endpoints
registry.registerPath({
  method: "get",
  path: "/products/search",
  tags: ["Products (Public)"],
  request: {
    query: SearchProductSchema,
  },
  responses: {
    200: {
      description: "Resultados de búsqueda",
      content: {
        "application/json": {
          schema: PaginatedProductsResponseSchema,
        },
      },
    },
  },
  security: [],
});

registry.registerPath({
  method: "get",
  path: "/products/paginated",
  tags: ["Products (Public)"],
  request: {
    query: PaginationQuerySchema,
  },
  responses: {
    200: {
      description: "Lista de productos paginada",
      content: {
        "application/json": {
          schema: PaginatedProductsResponseSchema,
        },
      },
    },
  },
  security: [],
});

registry.registerPath({
  method: "get",
  path: "/products/filter",
  tags: ["Products (Public)"],
  request: {
    query: FilterProductsSchema,
  },
  responses: {
    200: {
      description: "Lista de productos paginada",
      content: {
        "application/json": {
          schema: PaginatedProductsResponseSchema,
        },
      },
    },
  },
  security: [],
});

registry.registerPath({
  method: "get",
  path: "/products/news",
  tags: ["Products (Public)"],
  responses: {
    200: {
      description: "Nuevos productos",
      content: {
        "application/json": {
          schema: ResponseSchema.extend({
            message: z.string(),
            data: z.array(ProductBaseSchema),
          }),
        },
      },
    },
  },
  security: [],
});

