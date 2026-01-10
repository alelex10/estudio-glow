import { AppError } from "./app-error";

/**
 * Error para permisos insuficientes
 * HTTP Status: 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Permisos insuficientes") {
    super(message, 403, "AUTHORIZATION_ERROR");
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}
