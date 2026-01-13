import {
  AuthResponseSchema,
  ErrorResponseSchema,
  LoginSchema,
  RegisterSchema,
} from "../schemas/auth";
import { registry } from "./registry";

// Auth endpoints
registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Usuario registrado exitosamente",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
    400: {
      description: "Error en la solicitud",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Error del servidor",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login exitoso",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
    400: {
      description: "Credenciales inválidas",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Error del servidor",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Authentication"],
  responses: {
    200: {
      description: "Logout exitoso",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
  },
});
