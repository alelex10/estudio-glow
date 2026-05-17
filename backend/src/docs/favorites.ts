import { registry } from "./registry";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ErrorResponseSchema } from "../schemas/auth";
import { FavoriteParamsSchema } from "../schemas/favorite";

extendZodWithOpenApi(z);

const ProductIdParam = z.object({
  productId: z.string().openapi({
    param: { name: "productId", in: "path" },
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ID del producto",
  }),
});

// GET /favorites
registry.registerPath({
  method: "get",
  path: "/favorites",
  tags: ["Favorites"],
  summary: "Listar favoritos del usuario autenticado",
  responses: {
    200: {
      description: "Lista de productos favoritos",
      content: {
        "application/json": {
          schema: z
            .object({
              message: z.string(),
              data: z.array(
                z.object({
                  productId: z.string().uuid(),
                  name: z.string(),
                  price: z.number(),
                })
              ),
            })
            .openapi({
              example: {
                message: "Favorites fetched",
                data: [{ productId: "550e8400-e29b-41d4-a716-446655440000", name: "Crema Hidratante", price: 1200.0 }],
              },
            }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// GET /favorites/ids
registry.registerPath({
  method: "get",
  path: "/favorites/ids",
  tags: ["Favorites"],
  summary: "Obtener solo los IDs de productos favoritos del usuario",
  responses: {
    200: {
      description: "Array de IDs de productos favoritos",
      content: {
        "application/json": {
          schema: z
            .object({
              message: z.string(),
              data: z.array(z.string().uuid()),
            })
            .openapi({
              example: {
                message: "Favorite IDs fetched",
                data: ["550e8400-e29b-41d4-a716-446655440000", "a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
              },
            }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// POST /favorites/:productId
registry.registerPath({
  method: "post",
  path: "/favorites/{productId}",
  tags: ["Favorites"],
  summary: "Agregar un producto a favoritos",
  request: {
    params: ProductIdParam,
  },
  responses: {
    200: {
      description: "Producto agregado a favoritos",
      content: {
        "application/json": {
          schema: z
            .object({ message: z.string() })
            .openapi({ example: { message: "Favorite added" } }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Producto no encontrado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "El producto ya es favorito",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// DELETE /favorites/:productId
registry.registerPath({
  method: "delete",
  path: "/favorites/{productId}",
  tags: ["Favorites"],
  summary: "Eliminar un producto de favoritos",
  request: {
    params: ProductIdParam,
  },
  responses: {
    200: {
      description: "Producto eliminado de favoritos",
      content: {
        "application/json": {
          schema: z
            .object({ message: z.string() })
            .openapi({ example: { message: "Favorite removed" } }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Favorito no encontrado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});
