import { eq, and, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import { ResponseSchema } from "../schemas/response";
import { NotFoundError } from "../errors";
import { products } from "../models/product";
import { categories } from "../models/category";

/**
 * Verifica si un producto existe por ID
 * @param id - ID del producto
 * @param errorMessage - Mensaje de error si no se encuentra
 * @returns El producto encontrado
 * @throws NotFoundError si no existe
 */
export async function checkProductExists(
  id: string,
  errorMessage: string = "Producto no encontrado"
): Promise<typeof products.$inferSelect> {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!result[0]) {
    throw new NotFoundError(errorMessage);
  }

  return result[0];
}

/**
 * Verifica si una categoría existe por ID
 * @param id - ID de la categoría
 * @param errorMessage - Mensaje de error si no se encuentra
 * @returns La categoría encontrada
 * @throws NotFoundError si no existe
 */
export async function checkCategoryExistsById(
  id: string,
  errorMessage: string = "Categoría no encontrada"
): Promise<typeof categories.$inferSelect> {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!result[0]) {
    throw new NotFoundError(errorMessage);
  }

  return result[0];
}

/**
 * Crea una respuesta estandarizada de éxito
 * @param data - Datos a incluir en la respuesta
 * @param message - Mensaje opcional
 * @returns Objeto ResponseSchema parseado
 */
export function successResponse<T>(data: T, message: string = "Success") {
  return ResponseSchema.parse({
    data,
    message,
  });
}

/**
 * Crea una respuesta de creación exitosa
 * @param data - Datos creados
 * @param message - Mensaje opcional
 * @returns Objeto ResponseSchema con status 201
 */
export function createdResponse<T>(data: T, message: string = "Created successfully") {
  return ResponseSchema.parse({
    data,
    message,
  });
}

/**
 * Construye condiciones AND para queries
 * @param conditions - Array de condiciones SQL
 * @returns Condición SQL combinada o undefined
 */
export function buildWhereConditions(conditions: (SQL | undefined)[]): SQL | undefined {
  const validConditions = conditions.filter((c): c is SQL => c !== undefined);

  if (validConditions.length === 0) {
    return undefined;
  }

  if (validConditions.length === 1) {
    return validConditions[0];
  }

  return and(...validConditions);
}

/**
 * Parámetros de paginación estándar
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Metadatos de paginación
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Calcula los metadatos de paginación
 */
export function calculatePaginationMetadata(
  page: number,
  limit: number,
  totalItems: number
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Calcula el offset para SQL
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
