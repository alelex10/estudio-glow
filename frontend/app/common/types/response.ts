import type { User } from "./user-types";

// ========== RESPUESTAS API ==========
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

/**
 * Response from POST /auth/login when a Google user without password attempts login.
 * Backend sends a SET_PASSWORD email instead of rejecting.
 */
export interface SetPasswordEmailSentResponse {
  status: "set_password_email_sent";
  email: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface MessageResponse {
  message: string;
  user?: User;
}

export interface ResponseSchema<T> {
  data?: T;
  message?: string;
  // error?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ========== EMAIL VERIFICATION ==========

/**
 * Response from POST /auth/register when email verification is required.
 * Backend returns 201 with status="pending_verification" — NO JWT, NO session (F1.3).
 */
export interface RegisterPendingVerificationResponse {
  status: "pending_verification";
  email: string;
}

/**
 * Union type for all possible register responses.
 * - LoginResponse: legacy/Google auth that issues a session immediately
 * - RegisterPendingVerificationResponse: LOCAL register that requires email verification
 */
export type RegisterResponse = LoginResponse | RegisterPendingVerificationResponse;

// ========== GOOGLE LOGIN ACTION CONTRACT ==========

/**
 * Typed response for Google login action
 * Success returns undefined (redirect), failure returns this type
 */
export type GoogleLoginActionData =
  | { error: string; suggestion?: "register"; debugId?: string }
  | undefined;

/**
 * Normalized error metadata for Google login action
 */
export interface GoogleLoginErrorMetadata {
  code: string;
  message: string;
  retryable: boolean;
  suggestion?: "register";
  debugId?: string;
}

/**
 * Backend response from Google login endpoint — normal success (200/201)
 */
export interface BackendGoogleLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: "admin" | "customer";
    name: string;
    provider: "LOCAL" | "GOOGLE";
  };
  message: string;
}

/**
 * Backend 202 response when a verified LOCAL account needs explicit Google link.
 * The backend sent an account-link email; no JWT is issued.
 * Spec ref: C3b — ACCOUNT_LINK email flow
 */
export interface GoogleLinkEmailSentResponse {
  status: "link_email_sent";
  email: string;
}

/**
 * Union of all possible Google login endpoint responses.
 */
export type GoogleLoginResponse = BackendGoogleLoginResponse | GoogleLinkEmailSentResponse;
