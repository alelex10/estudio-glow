import { AppError } from "./app-error";

/**
 * Error para fallos de base de datos
 * HTTP Status: 500 Internal Server Error
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = "Error de base de datos",
    originalError?: Error
  ) {
    super(message, 500, "DATABASE_ERROR", false);

    // Preservar el error original para debugging
    if (originalError && originalError.stack) {
      this.stack = originalError.stack;
    }

    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}
