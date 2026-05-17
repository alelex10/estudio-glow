import { registry } from "./registry";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ErrorResponseSchema, UserResponseSchema } from "../schemas/auth";
import { PaginationOrderQuerySchema } from "../schemas/order";
import { ParamsIdSchema } from "../schemas/params";

extendZodWithOpenApi(z);

const OrderResponseSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    status: z.enum(["PENDING", "PAID", "PENDING_VERIFICATION", "CANCELLED", "EXPIRED"]),
    paymentMethod: z.enum(["TRANSFER", "MERCADO_PAGO"]),
    totalAmount: z.number(),
    createdAt: z.string().datetime(),
  })
  .openapi({
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      status: "PAID",
      paymentMethod: "MERCADO_PAGO",
      totalAmount: 1500.0,
      createdAt: "2026-05-15T10:00:00.000Z",
    },
  });

// GET /users/me
registry.registerPath({
  method: "get",
  path: "/users/me",
  tags: ["Users"],
  summary: "Obtener perfil del usuario autenticado",
  responses: {
    200: {
      description: "Perfil del usuario",
      content: {
        "application/json": {
          schema: z
            .object({ message: z.string(), data: UserResponseSchema })
            .openapi({ example: { message: "User fetched", data: { id: "admin-user-001", name: "Admin Estudio Glow", email: "admin@example.com", role: "customer", provider: "LOCAL" } } }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Usuario no encontrado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// GET /users/orders
registry.registerPath({
  method: "get",
  path: "/users/orders",
  tags: ["Users"],
  summary: "Listar órdenes del usuario autenticado",
  request: {
    query: PaginationOrderQuerySchema,
  },
  responses: {
    200: {
      description: "Lista paginada de órdenes del usuario",
      content: {
        "application/json": {
          schema: z
            .object({
              message: z.string(),
              data: z.array(OrderResponseSchema),
              total: z.number().int(),
              page: z.number().int(),
              pageSize: z.number().int(),
            })
            .openapi({ example: { message: "Orders fetched", data: [], total: 0, page: 1, pageSize: 10 } }),
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

// GET /users/orders/:id
registry.registerPath({
  method: "get",
  path: "/users/orders/{id}",
  tags: ["Users"],
  summary: "Obtener una orden del usuario autenticado por ID",
  request: {
    params: ParamsIdSchema,
  },
  responses: {
    200: {
      description: "Orden encontrada",
      content: {
        "application/json": {
          schema: z
            .object({ message: z.string(), data: OrderResponseSchema })
            .openapi({ example: { message: "Order fetched", data: { id: "550e8400-e29b-41d4-a716-446655440000", userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", status: "PAID", paymentMethod: "MERCADO_PAGO", totalAmount: 1500.0, createdAt: "2026-05-15T10:00:00.000Z" } } }),
        },
      },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Orden no encontrada o no pertenece al usuario",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});
