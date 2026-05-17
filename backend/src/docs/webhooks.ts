import { registry } from "./registry";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ErrorResponseSchema } from "../schemas/auth";

extendZodWithOpenApi(z);

// POST /webhooks/mercadopago
registry.registerPath({
  method: "post",
  path: "/webhooks/mercadopago",
  tags: ["Webhooks"],
  summary: "Recibir notificaciones de pago de MercadoPago",
  description:
    "Endpoint de webhook para notificaciones de MercadoPago. Valida la firma HMAC-SHA256 mediante los headers `x-signature` (formato `ts=<unix>,v1=<hex>`) y `x-request-id`. El cuerpo debe enviarse como `application/json` raw (sin parsear) para que la validación de firma sea correcta.",
  request: {
    headers: z.object({
      "x-signature": z.string().openapi({
        param: { name: "x-signature", in: "header" },
        example: "ts=1715000000,v1=abc123def456...",
        description: "Firma HMAC-SHA256 de MercadoPago en formato ts=<unix_seconds>,v1=<hex_digest>",
      }),
      "x-request-id": z.string().openapi({
        param: { name: "x-request-id", in: "header" },
        example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        description: "ID único de la solicitud enviado por MercadoPago, usado en el cálculo de firma",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              action: z.string().optional(),
              type: z.string().optional(),
              data: z
                .object({
                  id: z.string(),
                })
                .optional(),
            })
            .openapi({
              example: {
                action: "payment.updated",
                type: "payment",
                data: { id: "12345678" },
              },
            }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Webhook procesado exitosamente (o evento duplicado ignorado por idempotencia)",
    },
    400: {
      description: "Cuerpo del webhook no parseable como JSON",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "Firma inválida, headers faltantes, clock skew excedido o secreto no configurado",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Error del servidor",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
  security: [],
});
