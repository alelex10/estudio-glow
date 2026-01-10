import { AppError } from "./app-error";

/**
 * Error para fallos de autenticación
 * HTTP Status: 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "No autenticado") {
    super(message, 401, "AUTHENTICATION_ERROR");
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
