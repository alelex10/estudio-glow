import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const RegisterSchema = z
  .object({
    name: z.string().min(1).openapi({
      example: "Juan Pérez",
      description: "Nombre completo del usuario",
    }),
    email: z.email().openapi({
      example: "juan@example.com",
      description: "Correo electrónico del usuario",
    }),
    password: z.string().min(6).openapi({
      example: "password123",
      description: "Contraseña del usuario (mínimo 6 caracteres)",
    }),
    role: z.enum(["admin", "customer"]).optional().openapi({
      example: "admin",
      description: "Rol del usuario (admin o customer)",
    }),
  })
  .openapi("RegisterRequest");

export const LoginSchema = z
  .object({
    email: z.email().openapi({
      example: "juan@example.com",
      description: "Correo electrónico del usuario",
    }),
    password: z.string().min(1).openapi({
      example: "password123",
      description: "Contraseña del usuario",
    }),
  })
  .openapi("LoginRequest");

export const UserResponseSchema = z
  .object({
    id: z.string().openapi({
      example: "admin-user-001",
      description: "ID del usuario",
    }),
    name: z.string().openapi({
      example: "Admin Estudio Glow",
      description: "Nombre del usuario",
    }),
    email: z.email().openapi({
      example: "yasitacardenas3637@gmail.com",
      description: "Correo electrónico del usuario",
    }),
    role: z.enum(["admin", "customer"]).openapi({
      example: "admin",
      description: "Rol del usuario",
    }),
    provider: z.enum(["LOCAL", "GOOGLE"]).optional().openapi({
      example: "LOCAL",
      description: "Proveedor de autenticación",
    }),
  })
  .openapi("UserResponse");

export const AuthResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Login successful",
      description: "Mensaje de respuesta",
    }),
    user: UserResponseSchema.optional(),
  })
  .openapi("AuthResponse");

export const ErrorResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Error message",
      description: "Mensaje de error",
    }),
  })
  .openapi("ErrorResponse");
