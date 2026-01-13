import { registry } from "./registry";

registry.registerPath({
  method: "get",
  path: "/dashboard/stats",
  tags: ["Dashboard"],
  summary: "Obtener estadísticas del dashboard",
  description:
    "Retorna estadísticas generales del sistema incluyendo productos, categorías y niveles de stock",
  responses: {
    200: {
      description: "Estadísticas del dashboard obtenidas exitosamente",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              total: {
                type: "number",
                description: "Total de productos en el sistema",
                example: 150,
              },
              lowStock: {
                type: "number",
                description:
                  "Número de productos con stock bajo (menos de 10 unidades)",
                example: 12,
              },
              totalCategory: {
                type: "number",
                description: "Total de categorías registradas",
                example: 8,
              },
              withoutStock: {
                type: "number",
                description: "Número de productos sin stock (stock igual a 0)",
                example: 5,
              },
              totalValue: {
                type: "number",
                description: "Valor total de todos los productos en stock",
                example: 15000,
              },
            },
            required: [
              "total",
              "lowStock",
              "totalCategory",
              "withoutStock",
              "totalValue",
            ],
          },
        },
      },
    },
    401: {
      description: "No autorizado - token de autenticación inválido o ausente",
    },
    500: {
      description: "Error interno del servidor",
    },
  },
  security: [{ bearerAuth: [] }],
});
