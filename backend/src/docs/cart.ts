import { registry } from "./registry";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ErrorResponseSchema } from "../schemas/auth";
import { CartItemSchema, SyncCartSchema } from "../schemas/cart";

extendZodWithOpenApi(z);

// GET /cart
registry.registerPath({
  method: "get",
  path: "/cart",
  tags: ["Cart"],
  summary: "Obtener carrito del usuario autenticado",
  responses: {
    200: {
      description: "Carrito del usuario",
      content: {
        "application/json": {
          schema: z
            .object({
              message: z.string(),
              data: z.object({
                items: z.array(
                  z.object({
                    productId: z.string().uuid(),
                    quantity: z.number().int().positive(),
                  })
                ),
              }),
            })
            .openapi({ example: { message: "Cart fetched", data: { items: [{ productId: "550e8400-e29b-41d4-a716-446655440000", quantity: 2 }] } } }),
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

// POST /cart/sync
registry.registerPath({
  method: "post",
  path: "/cart/sync",
  tags: ["Cart"],
  summary: "Sincronizar carrito local con el servidor",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SyncCartSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Carrito sincronizado exitosamente",
      content: {
        "application/json": {
          schema: z
            .object({ message: z.string(), data: z.array(CartItemSchema) })
            .openapi({ example: { message: "Cart synced", data: [{ productId: "550e8400-e29b-41d4-a716-446655440000", quantity: 1 }] } }),
        },
      },
    },
    400: {
      description: "Datos de carrito inválidos",
      content: { "application/json": { schema: ErrorResponseSchema } },
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

// DELETE /cart/:productId
registry.registerPath({
  method: "delete",
  path: "/cart/{productId}",
  tags: ["Cart"],
  summary: "Eliminar un item del carrito",
  request: {
    params: z.object({
      productId: z.string().openapi({
        param: { name: "productId", in: "path" },
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "ID del producto a eliminar del carrito",
      }),
    }),
  },
  responses: {
    200: {
      description: "Item eliminado del carrito",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }).openapi({ example: { message: "Cart item removed" } }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Item no encontrado en el carrito",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});
