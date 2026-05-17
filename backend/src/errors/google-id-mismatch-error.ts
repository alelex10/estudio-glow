import { AppError } from "./app-error";

/**
 * Error when the google_id on an existing user record differs from the google_id
 * in the token being consumed during the account-link confirm flow.
 * This indicates the user already linked a DIFFERENT Google account between the
 * time the link email was sent and when the link was clicked.
 * HTTP Status: 409 Conflict
 * Code: GOOGLE_ID_MISMATCH
 *
 * Spec ref: F3.6, F3.7 — confirmLink must re-check google_id drift before applying link
 */
export class GoogleIdMismatchError extends AppError {
  constructor(
    message: string = "Tu cuenta ya fue vinculada con una cuenta de Google diferente. El link expiró.",
  ) {
    super(message, 409, "GOOGLE_ID_MISMATCH");
    Object.setPrototypeOf(this, GoogleIdMismatchError.prototype);
  }
}
