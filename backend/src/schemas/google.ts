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

export const GoogleAuthResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["admin", "customer"]),
    provider: z.literal("GOOGLE"),
  }),
}).openapi("GoogleAuthResponse");

export const GoogleRegisterResponseSchema = GoogleAuthResponseSchema.openapi("GoogleRegisterResponse");
export const GoogleLoginResponseSchema = GoogleAuthResponseSchema.openapi("GoogleLoginResponse");
