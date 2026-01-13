import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";

// Import modules to register paths
import "./auth";
import "./products";
import "./categories";
import "./dashboard";

import {
  AuthResponseSchema,
  ErrorResponseSchema,
  UserResponseSchema,
} from "../schemas/auth";
import {
  ProductListResponseSchema,
  ProductWithCategoryResponseSchema,
} from "../schemas/product";
import {
  CategoryListResponseSchema,
  CategoryResponseSchema,
} from "../schemas/category";

// Register schemas
registry.register("AuthResponse", AuthResponseSchema);
registry.register("UserResponse", UserResponseSchema);
registry.register("ErrorResponse", ErrorResponseSchema);
registry.register("ProductResponse", ProductWithCategoryResponseSchema);
registry.register("ProductListResponse", ProductListResponseSchema);
registry.register("CategoryResponse", CategoryResponseSchema);
registry.register("CategoryListResponse", CategoryListResponseSchema);

// Generate OpenAPI specification
export function generateOpenApi() {
  const config = {
    openapi: "3.0.0",
    info: {
      title: "API de E-commerce",
      version: "1.0.0",
      description: "API backend para gestión de productos y autenticación",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de desarrollo",
        security: [
          {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        ],
      },
      {
        url: "https://estudio-glow.onrender.com/",
        description: "Servidor de producción",
        security: [
          {
            bearerAuth: {
              type: "https",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        ],
      },
    ],
  };

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument(config);
}
