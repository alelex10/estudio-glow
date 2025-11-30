import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const RegisterSchema = z.object({
  name: z.string().min(1).openapi({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario'
  }),
  email: z.email().openapi({
    example: 'juan@example.com',
    description: 'Correo electrónico del usuario'
  }),
  password: z.string().min(6).openapi({
    example: 'password123',
    description: 'Contraseña del usuario (mínimo 6 caracteres)'
  }),
  role: z.enum(['admin', 'customer']).optional().openapi({
    example: 'customer',
    description: 'Rol del usuario (admin o customer)'
  })
}).openapi('RegisterRequest');

export const LoginSchema = z.object({
  email: z.email().openapi({
    example: 'juan@example.com',
    description: 'Correo electrónico del usuario'
  }),
  password: z.string().min(1).openapi({
    example: 'password123',
    description: 'Contraseña del usuario'
  })
}).openapi('LoginRequest');

export const UserResponseSchema = z.object({
  id: z.number().openapi({
    example: 1,
    description: 'ID del usuario'
  }),
  name: z.string().openapi({
    example: 'Juan Pérez',
    description: 'Nombre del usuario'
  }),
  email: z.email().openapi({
    example: 'juan@example.com',
    description: 'Correo electrónico del usuario'
  }),
  role: z.enum(['admin', 'customer']).openapi({
    example: 'customer',
    description: 'Rol del usuario'
  })
}).openapi('UserResponse');

export const AuthResponseSchema = z.object({
  message: z.string().openapi({
    example: 'Login successful',
    description: 'Mensaje de respuesta'
  }),
  user: UserResponseSchema.optional()
}).openapi('AuthResponse');

export const ErrorResponseSchema = z.object({
  message: z.string().openapi({
    example: 'Error message',
    description: 'Mensaje de error'
  })
}).openapi('ErrorResponse');
