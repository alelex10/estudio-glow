import { registry } from "./registry";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ErrorResponseSchema } from "../schemas/auth";
import { CartItemSchema } from "../schemas/cart";

extendZodWithOpenApi(z);

const IdempotencyKeyHeader = z.object({
  "idempotency-key": z.string().openapi({
    param: { name: "idempotency-key", in: "header" },
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    description: "Clave de idempotencia requerida para evitar órdenes duplicadas (UUID o string único por intento de pago)",
  }),
});

// POST /checkout/mercadopago
registry.registerPath({
  method: "post",
  path: "/checkout/mercadopago",
  tags: ["Checkout"],
  summary: "Iniciar pago con MercadoPago",
  request: {
    headers: IdempotencyKeyHeader,
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              items: z.array(CartItemSchema),
            })
            .openapi({
              example: {
                items: [{ productId: "550e8400-e29b-41d4-a716-446655440000", quantity: 2 }],
              },
            }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Preferencia de pago de MercadoPago creada",
      content: {
        "application/json": {
          schema: z
            .object({
              orderId: z.string().uuid(),
              preferenceUrl: z.string().url(),
            })
            .openapi({
              example: {
                orderId: "550e8400-e29b-41d4-a716-446655440000",
                preferenceUrl: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
              },
            }),
        },
      },
    },
    400: {
      description: "Carrito vacío, items inválidos o falta Idempotency-Key",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "Solicitud duplicada en vuelo (mismo Idempotency-Key concurrente)",
      content: {
        "application/json": {
          schema: z
            .object({ error: z.object({ message: z.string() }) })
            .openapi({ example: { error: { message: "Duplicate request in flight" } } }),
        },
      },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

// POST /checkout/transfer
registry.registerPath({
  method: "post",
  path: "/checkout/transfer",
  tags: ["Checkout"],
  summary: "Iniciar pago por transferencia bancaria con comprobante",
  request: {
    headers: IdempotencyKeyHeader,
    body: {
      content: {
        "multipart/form-data": {
          schema: z
            .object({
              receipt: z.any().openapi({
                description: "Imagen del comprobante de transferencia (JPG, PNG, WEBP — máx 5 MB)",
                example: "(binary file)",
              }),
              items: z.string().openapi({
                description: "JSON serializado del array de items del carrito",
                example: '[{"productId":"550e8400-e29b-41d4-a716-446655440000","quantity":1}]',
              }),
            })
            .openapi({
              example: {
                receipt: "(binary file)",
                items: '[{"productId":"550e8400-e29b-41d4-a716-446655440000","quantity":1}]',
              },
            }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Orden de transferencia creada, pendiente de verificación",
      content: {
        "application/json": {
          schema: z
            .object({
              orderId: z.string().uuid(),
              status: z.literal("PENDING_VERIFICATION"),
              receiptUrl: z.string().url(),
            })
            .openapi({
              example: {
                orderId: "550e8400-e29b-41d4-a716-446655440000",
                status: "PENDING_VERIFICATION",
                receiptUrl: "https://res.cloudinary.com/example/receipts/abc123.jpg",
              },
            }),
        },
      },
    },
    400: {
      description: "Comprobante faltante, carrito vacío, items inválidos o falta Idempotency-Key",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "No autenticado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    409: {
      description: "Solicitud duplicada en vuelo (mismo Idempotency-Key concurrente)",
      content: {
        "application/json": {
          schema: z
            .object({ error: z.object({ message: z.string() }) })
            .openapi({ example: { error: { message: "Duplicate request in flight" } } }),
        },
      },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});
