import { registry } from "./registry";
import { z } from "zod";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryResponseSchema,
  CategoryListResponseSchema,
  ErrorResponseSchema,
} from "../schemas";

// Category endpoints (Admin)
registry.registerPath({
  method: "get",
  path: "/categories",
  tags: ["Categories (Admin)"],
  responses: {
    200: {
      description: "Lista de categorías",
      content: {
        "application/json": {
          schema: CategoryListResponseSchema,
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
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "get",
  path: "/categories/{id}",
  tags: ["Categories (Admin)"],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "1",
        description: "ID de la categoría",
      }),
    }),
  },
  responses: {
    200: {
      description: "Categoría encontrada",
      content: {
        "application/json": {
          schema: CategoryResponseSchema,
        },
      },
    },
    404: {
      description: "Categoría no encontrada",
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
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "post",
  path: "/categories",
  tags: ["Categories (Admin)"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCategorySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Categoría creada exitosamente",
      content: {
        "application/json": {
          schema: CategoryResponseSchema,
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
    409: {
      description: "Categoría ya existe",
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
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "put",
  path: "/categories/{id}",
  tags: ["Categories (Admin)"],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "1",
        description: "ID de la categoría",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateCategorySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Categoría actualizada exitosamente",
      content: {
        "application/json": {
          schema: CategoryResponseSchema,
        },
      },
    },
    404: {
      description: "Categoría no encontrada",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: "Nombre de categoría ya existe",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
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
  security: [{ bearerAuth: [] }],
});

registry.registerPath({
  method: "delete",
  path: "/categories/{id}",
  tags: ["Categories (Admin)"],
  request: {
    params: z.object({
      id: z.string().openapi({
        param: {
          name: "id",
          in: "path",
        },
        example: "1",
        description: "ID de la categoría",
      }),
    }),
  },
  responses: {
    200: {
      description: "Categoría eliminada exitosamente",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }).openapi({
            example: { message: "Category deleted successfully" },
          }),
        },
      },
    },
    404: {
      description: "Categoría no encontrada",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: "No se puede eliminar categoría con productos asociados",
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
  security: [{ bearerAuth: [] }],
});
