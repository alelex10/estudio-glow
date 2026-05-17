import { AppError } from "./app-error";

/**
 * Error when a LOCAL user attempts to login with email_verified = false.
 * HTTP Status: 403 Forbidden
 * Code: EMAIL_NOT_VERIFIED
 */
export class EmailNotVerifiedError extends AppError {
  constructor(message: string = "Por favor verificá tu email antes de iniciar sesión") {
    super(message, 403, "EMAIL_NOT_VERIFIED");
    Object.setPrototypeOf(this, EmailNotVerifiedError.prototype);
  }
}
