import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const GoogleAuthSchema = z
  .object({
    idToken: z.string().min(1).openapi({
      example: "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
      description: "Token de ID de Google obtenido del frontend",
    }),
  })
  .openapi("GoogleAuthRequest");

export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
