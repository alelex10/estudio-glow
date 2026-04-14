import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const FavoriteParamsSchema = z
  .object({
    productId: z.string().min(1).openapi({
      example: "product-uuid-001",
      description: "ID del producto",
    }),
  })
  .openapi("FavoriteParams");

export type FavoriteParams = z.infer<typeof FavoriteParamsSchema>;
