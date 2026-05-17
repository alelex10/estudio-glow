import { AppError } from "./app-error";

/**
 * Error when the Google token's email is not verified by Google.
 * This is a hard block — Google accounts with unverified emails are rejected.
 * HTTP Status: 401 Unauthorized
 * Code: GOOGLE_EMAIL_UNVERIFIED
 *
 * Spec ref: F3.5 — verifyGoogleToken MUST enforce payload.email_verified === true
 */
export class GoogleEmailUnverifiedError extends AppError {
  constructor(
    message: string = "Tu cuenta de Google no tiene el email verificado. Por favor verificá tu cuenta de Google antes de continuar.",
  ) {
    super(message, 401, "GOOGLE_EMAIL_UNVERIFIED");
    Object.setPrototypeOf(this, GoogleEmailUnverifiedError.prototype);
  }
}
