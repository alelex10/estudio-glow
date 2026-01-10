import { AppError } from "./app-error";

/**
 * Error para conflictos (ej: recurso duplicado)
 * HTTP Status: 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = "Conflicto con recurso existente") {
    super(message, 409, "CONFLICT_ERROR");
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
