import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { PaginationQuerySchema } from "./common/paginated";

extendZodWithOpenApi(z);

export const PaginationOrderQuerySchema = z
  .object({
    sortBy: z
      .enum(["createdAt", "totalAmount"])
      .default("createdAt")
      .openapi({
        example: "createdAt",
        description: "Campo por el cual ordenar",
      }),
    status: z
      .enum(["PENDING", "PAID", "PENDING_VERIFICATION", "CANCELLED", "EXPIRED"])
      .optional()
      .openapi({
        example: "PENDING_VERIFICATION",
        description: "Filtrar por estado de la orden",
      }),
    paymentMethod: z
      .enum(["TRANSFER", "MERCADO_PAGO"])
      .optional()
      .openapi({
        example: "TRANSFER",
        description: "Filtrar por método de pago",
      }),
    includeItems: z
      .boolean()
      .optional()
      .openapi({
        example: false,
        description: "Incluir items de la orden en la respuesta",
      }),
  })
  .safeExtend(PaginationQuerySchema.shape)
  .openapi("PaginationOrderQuery");

export type PaginationOrderQuery = z.infer<typeof PaginationOrderQuerySchema>;
