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
    message: string;
    statusCode: number;
    error: string;
  };
}

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
 * Backend response from Google login endpoint
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
