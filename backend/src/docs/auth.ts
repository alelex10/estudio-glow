import {
  AuthResponseSchema,
  ErrorResponseSchema,
  LoginSchema,
  RegisterSchema,
} from "../schemas/auth";
import {
  GoogleAuthSchema,
  GoogleRegisterResponseSchema,
  GoogleLoginResponseSchema,
} from "../schemas/google";
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

// Google Auth endpoints
registry.registerPath({
  method: "post",
  path: "/auth/google",
  tags: ["Authentication", "Google OAuth"],
  deprecated: true,
  description: "DEPRECATED: Use /auth/google/register or /auth/google/login instead. Will be removed after 2026-05-02.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GoogleAuthSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login/registro híbrido con Google (deprecated)",
      content: {
        "application/json": {
          schema: GoogleRegisterResponseSchema,
        },
      },
    },
    401: {
      description: "Token de Google inválido",
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
  path: "/auth/google/register",
  tags: ["Authentication", "Google OAuth"],
  description: "Registrar un nuevo usuario usando Google OAuth",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GoogleAuthSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Usuario registrado exitosamente con Google",
      content: {
        "application/json": {
          schema: GoogleRegisterResponseSchema,
        },
      },
    },
    409: {
      description: "El usuario ya existe (con Google o con email local)",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Token de Google inválido",
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
  path: "/auth/google/login",
  tags: ["Authentication", "Google OAuth"],
  description: "Iniciar sesión usando Google OAuth (usuario debe estar previamente registrado)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GoogleAuthSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login exitoso con Google",
      content: {
        "application/json": {
          schema: GoogleLoginResponseSchema,
        },
      },
    },
    401: {
      description: "Usuario no registrado o token inválido",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
