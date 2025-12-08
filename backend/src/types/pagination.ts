/**
 * Interfaz para los parámetros de paginación
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: "name" | "price" | "createdAt" | "stock";
  sortOrder?: "asc" | "desc";
}

/**
 * Interfaz para los metadatos de paginación en la respuesta
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
 * Interfaz genérica para respuestas paginadas
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Clase helper para calcular metadatos de paginación
 */
export class PaginationHelper {
  /**
   * Calcula los metadatos de paginación
   */
  static calculateMetadata(
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
   * Calcula el offset para la consulta SQL
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
