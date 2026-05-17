import { AppError } from "./app-error";

/**
 * Error para fallos de validación CSRF
 * HTTP Status: 403 Forbidden
 */
export class CsrfError extends AppError {
  constructor(message: string = "CSRF check failed") {
    super(message, 403, "CSRF_ERROR");
    Object.setPrototypeOf(this, CsrfError.prototype);
  }
}
