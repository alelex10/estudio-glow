import { AppError } from "./app-error";

/**
 * Error para conflictos (ej: recurso duplicado)
 * HTTP Status: 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = "Conflicto con recurso existente", code: string = "CONFLICT_ERROR") {
    super(message, 409, code);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
