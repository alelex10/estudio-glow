import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Estudio Glow',
      version: '1.0.0',
      description: 'Documentación de la API para el sistema de gestión de Estudio Glow',
      contact: {
        name: 'API Support',
        email: 'support@estudioglow.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Autenticación mediante token JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'role'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del usuario',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del usuario',
            },
            password: {
              type: 'string',
              description: 'Contraseña del usuario (mínimo 6 caracteres)',
            },
            role: {
              type: 'string',
              enum: ['admin', 'customer'],
              description: 'Rol del usuario en el sistema',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del usuario',
            },
          },
        },
        Product: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del producto',
            },
            name: {
              type: 'string',
              description: 'Nombre del producto',
            },
            description: {
              type: 'string',
              description: 'Descripción detallada del producto',
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Precio del producto',
            },
            stock: {
              type: 'integer',
              description: 'Cantidad disponible en stock',
            },
            category: {
              type: 'string',
              description: 'Categoría del producto',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del producto',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de respuesta',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            token: {
              type: 'string',
              description: 'Token JWT para autenticación',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de error',
            },
            error: {
              type: 'string',
              description: 'Detalles del error',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controller/*.ts'],
};

export const specs = swaggerJsdoc(options);
