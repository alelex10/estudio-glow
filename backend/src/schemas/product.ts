import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255).openapi({
    example: 'Laptop Gaming',
    description: 'Nombre del producto'
  }),
  description: z.string().max(500).optional().openapi({
    example: 'Laptop de alto rendimiento para gaming',
    description: 'Descripción del producto'
  }),
  price: z.number().positive().openapi({
    example: 1500.99,
    description: 'Precio del producto'
  }),
  stock: z.number().int().min(0).openapi({
    example: 50,
    description: 'Cantidad en stock'
  }),
  category: z.string().min(1).max(100).openapi({
    example: 'Electrónica',
    description: 'Categoría del producto'
  }),
  imageUrl: z.url().optional().openapi({
    example: 'https://example.com/image.jpg',
    description: 'URL de la imagen del producto'
  })
}).openapi('CreateProductRequest');

export const UpdateProductSchema = CreateProductSchema.partial().openapi('UpdateProductRequest');

export const ProductResponseSchema = z.object({
  id: z.number().openapi({
    example: 1,
    description: 'ID del producto'
  }),
  name: z.string().openapi({
    example: 'Laptop Gaming',
    description: 'Nombre del producto'
  }),
  description: z.string().nullable().openapi({
    example: 'Laptop de alto rendimiento para gaming',
    description: 'Descripción del producto'
  }),
  price: z.number().openapi({
    example: 1500.99,
    description: 'Precio del producto'
  }),
  stock: z.number().openapi({
    example: 50,
    description: 'Cantidad en stock'
  }),
  category: z.string().openapi({
    example: 'Electrónica',
    description: 'Categoría del producto'
  }),
  imageUrl: z.string().nullable().openapi({
    example: 'https://example.com/image.jpg',
    description: 'URL de la imagen del producto'
  }),
  createdAt: z.string().datetime().openapi({
    example: '2024-01-15T10:30:00Z',
    description: 'Fecha de creación'
  }),
  updatedAt: z.string().datetime().openapi({
    example: '2024-01-15T10:30:00Z',
    description: 'Fecha de actualización'
  })
}).openapi('ProductResponse');

export const ProductListResponseSchema = z.object({
  products: z.array(ProductResponseSchema).openapi({
    description: 'Lista de productos'
  })
}).openapi('ProductListResponse');

export const SearchProductSchema = z.object({
  q: z.string().min(1).optional().openapi({
    example: 'laptop',
    description: 'Término de búsqueda'
  }),
  category: z.string().optional().openapi({
    example: 'Electrónica',
    description: 'Filtrar por categoría'
  }),
  minPrice: z.number().positive().optional().openapi({
    example: 100,
    description: 'Precio mínimo'
  }),
  maxPrice: z.number().positive().optional().openapi({
    example: 2000,
    description: 'Precio máximo'
  })
}).openapi('SearchProductRequest');
