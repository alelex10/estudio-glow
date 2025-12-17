import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import z from "zod";

extendZodWithOpenApi(z);

export const ResponseSchema = z.object({
  message: z.string().openapi({ example: "Success" }),
  data: z.any().optional(),
});
