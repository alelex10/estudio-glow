import { apiClient, ApiError } from "../config/api-client";
import type {
  LoginResponse,
  SetPasswordEmailSentResponse,
  BackendGoogleLoginResponse,
  GoogleLoginResponse,
  GoogleLinkEmailSentResponse,
  RegisterResponse,
} from "../types/response";

/**
 * Realiza el login directamente desde el servidor sin depender del cliente
 */
export async function serverLogin(
  email: string,
  password: string,
): Promise<LoginResponse | SetPasswordEmailSentResponse> {
  return apiClient<LoginResponse | SetPasswordEmailSentResponse>({
    endpoint: "/auth/login",
    options: {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  });
}

/**
 * Realiza el registro directamente desde el servidor sin depender del cliente.
 * Returns LoginResponse (session) or RegisterPendingVerificationResponse (email gate).
 */
export async function serverRegister(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  return apiClient<RegisterResponse>({
    endpoint: "/auth/register",
    options: {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    },
  });
}

/**
 * T2-10: Sends a POST /auth/resend-verification request.
 * Always returns 200 (anti-enumeration) — caller should not branch on success/failure.
 * Rate-limited on the backend (1/60s per email).
 */
export async function resendVerification(email: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>({
    endpoint: "/auth/resend-verification",
    options: {
      method: "POST",
      body: JSON.stringify({ email }),
    },
  });
}

export async function serverGoogleRegister(
  idToken: string,
): Promise<LoginResponse> {
  return apiClient<LoginResponse>({
    endpoint: "/auth/google/register",
    options: {
      method: "POST",
      body: JSON.stringify({ idToken }),
    },
  });
}

export async function logout() {
  await apiClient({
    options: {
      method: "POST",
    },
    endpoint: "/auth/logout",
  });
}

/**
 * Server-side Google login helper
 * Calls backend /auth/google/login with idToken
 * Returns typed response or throws on failure
 */
export async function serverGoogleLogin(
  idToken: string,
): Promise<BackendGoogleLoginResponse> {
  try {
    return await apiClient<BackendGoogleLoginResponse>({
      endpoint: "/auth/google/login",
      options: {
        method: "POST",
        body: JSON.stringify({ idToken }),
      },
    });
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;

    const mappedCode = mapGoogleLoginErrorCode(err);
    const mapped = new Error(err.message) as Error & {
      code: string;
      statusCode: number;
    };
    mapped.code = mappedCode;
    mapped.statusCode = err.statusCode;
    throw mapped;
  }
}

function mapGoogleLoginErrorCode(err: ApiError): string {
  switch (err.code) {
    case "CSRF_ERROR":
      return "CSRF_FAILED";
    case "AUTHENTICATION_ERROR":
      return "NOT_REGISTERED";
    case "AUTHORIZATION_ERROR":
      return "CONSENT_DENIED";
    default:
      return err.statusCode >= 500 ? "UPSTREAM_UNAVAILABLE" : "UNKNOWN";
  }
}

/**
 * T3-07: Google login with full response union support.
 *
 * Handles 200/201 (session) and 202 (link_email_sent) responses.
 * Propagates ApiError for 401 GOOGLE_EMAIL_UNVERIFIED and 409 GOOGLE_ID_MISMATCH
 * so the action can surface the error code to the UI.
 */
export async function serverGoogleLoginFull(
  idToken: string,
): Promise<GoogleLoginResponse> {
  return apiClient<GoogleLoginResponse>({
    endpoint: "/auth/google/login",
    options: {
      method: "POST",
      body: JSON.stringify({ idToken }),
    },
  });
}

/**
 * Sets a password for the current authenticated user.
 * Used by Google-created users to enable manual login.
 */
export async function serverSetPassword(
  token: string,
  password: string,
): Promise<{ status: string }> {
  return apiClient<{ status: string }>({
    token,
    endpoint: "/auth/set-password",
    options: {
      method: "POST",
      body: JSON.stringify({ password }),
    },
  });
}

/**
 * Sets a password using a SET_PASSWORD token from email.
 * No authentication required.
 */
export async function serverSetPasswordByToken(
  token: string,
  password: string,
): Promise<{ status: string }> {
  return apiClient<{ status: string }>({
    endpoint: "/auth/set-password-by-token",
    options: {
      method: "POST",
      body: JSON.stringify({ token, password }),
    },
  });
}
