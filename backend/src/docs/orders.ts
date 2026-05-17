import { registry } from "./registry";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ErrorResponseSchema } from "../schemas/auth";
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
      status: "PENDING",
      paymentMethod: "MERCADO_PAGO",
      totalAmount: 1500.0,
      createdAt: "2026-05-15T10:00:00.000Z",
    },
  });

const PaginatedOrdersResponseSchema = z
  .object({
    message: z.string(),
    data: z.array(OrderResponseSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  })
  .openapi({ example: { message: "Orders fetched", data: [], total: 0, page: 1, pageSize: 10 } });

// GET /orders/stats — Admin
registry.registerPath({
  method: "get",
  path: "/orders/stats",
  tags: ["Orders (Admin)"],
  summary: "Obtener estadísticas de productos/ventas",
  responses: {
    200: {
      description: "Estadísticas de ventas",
      content: {
        "application/json": {
          schema: z
            .object({ message: z.string(), data: z.object({}) })
            .openapi({ example: { message: "Stats fetched", data: {} } }),
        },
      },
    },
    401: {
      description: "No autenticado o sin permisos de admin",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// GET /orders — Admin
registry.registerPath({
  method: "get",
  path: "/orders",
  tags: ["Orders (Admin)"],
  summary: "Listar todas las órdenes (admin)",
  request: {
    query: PaginationOrderQuerySchema,
  },
  responses: {
    200: {
      description: "Lista paginada de órdenes",
      content: { "application/json": { schema: PaginatedOrdersResponseSchema } },
    },
    401: {
      description: "No autenticado o sin permisos de admin",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// GET /orders/:id — Admin
registry.registerPath({
  method: "get",
  path: "/orders/{id}",
  tags: ["Orders (Admin)"],
  summary: "Obtener orden por ID (admin)",
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
            .openapi({ example: { message: "Order fetched", data: { id: "550e8400-e29b-41d4-a716-446655440000", userId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", status: "PENDING", paymentMethod: "MERCADO_PAGO", totalAmount: 1500.0, createdAt: "2026-05-15T10:00:00.000Z" } } }),
        },
      },
    },
    401: {
      description: "No autenticado o sin permisos de admin",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Orden no encontrada",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// POST /orders/:id/approve — Admin
registry.registerPath({
  method: "post",
  path: "/orders/{id}/approve",
  tags: ["Orders (Admin)"],
  summary: "Aprobar una orden (admin)",
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        param: { name: "id", in: "path" },
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "ID de la orden",
      }),
    }),
  },
  responses: {
    200: {
      description: "Orden aprobada exitosamente",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }).openapi({ example: { message: "Order approved" } }),
        },
      },
    },
    401: {
      description: "No autenticado o sin permisos de admin",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Orden no encontrada",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// POST /orders/:id/reject — Admin
registry.registerPath({
  method: "post",
  path: "/orders/{id}/reject",
  tags: ["Orders (Admin)"],
  summary: "Rechazar una orden (admin)",
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        param: { name: "id", in: "path" },
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "ID de la orden",
      }),
    }),
  },
  responses: {
    200: {
      description: "Orden rechazada exitosamente",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }).openapi({ example: { message: "Order rejected" } }),
        },
      },
    },
    401: {
      description: "No autenticado o sin permisos de admin",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Orden no encontrada",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});
