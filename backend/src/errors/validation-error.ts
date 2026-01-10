import { AppError } from "./app-error";

/**
 * Error para fallos de validación de datos
 * HTTP Status: 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string = "Error de validación") {
    super(message, 400, "VALIDATION_ERROR");
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
