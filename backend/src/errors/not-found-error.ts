import { AppError } from "./app-error";

/**
 * Error para recursos no encontrados
 * HTTP Status: 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Recurso no encontrado") {
    super(message, 404, "NOT_FOUND");
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
