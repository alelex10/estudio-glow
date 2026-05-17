import { AppError } from "./app-error";

/**
 * Error para fallos de autenticación
 * HTTP Status: 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "No autenticado", code: string = "AUTHENTICATION_ERROR") {
    super(message, 401, code);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
