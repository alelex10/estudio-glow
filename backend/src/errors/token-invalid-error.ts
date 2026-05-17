import { AppError } from "./app-error";

/**
 * Error for expired, used, or non-existent auth tokens.
 * HTTP Status: 410 Gone
 * Code: TOKEN_INVALID
 *
 * N1.3: Expired tokens, used tokens, and non-existent tokens return the same
 * error code and status with no timing observable difference.
 */
export class TokenInvalidError extends AppError {
  constructor(message: string = "El token es inválido, expiró o ya fue utilizado") {
    super(message, 410, "TOKEN_INVALID");
    Object.setPrototypeOf(this, TokenInvalidError.prototype);
  }
}
