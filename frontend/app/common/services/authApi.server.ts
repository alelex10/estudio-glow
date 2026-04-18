import { apiClient } from "../config/api-client";
import { API_BASE_URL } from "../config/api-end-points";
import type { LoginResponse, BackendGoogleLoginResponse } from "../types/response";

/**
 * Realiza el login directamente desde el servidor sin depender del cliente
 */
export async function serverLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const url = `${API_BASE_URL}/auth/login`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Error: ${response.status}`,
    }));
    throw new Error(errorData.message || `Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Realiza el registro directamente desde el servidor sin depender del cliente
 */
export async function serverRegister(
  name: string,
  email: string,
  password: string,
): Promise<LoginResponse> {
  const url = `${API_BASE_URL}/auth/register`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Error: ${response.status}`,
    }));
    throw new Error(errorData.message || `Error: ${response.status}`);
  }

  return response.json();
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
  const url = `${API_BASE_URL}/auth/google/login`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Error: ${response.status}`,
    }));
    const errorMessage = errorData.error?.message || errorData.message || `Error: ${response.status}`;
    const error = new Error(errorMessage) as Error & { code?: string; statusCode?: number };
    error.statusCode = response.status;
    // Map backend error codes
    if (response.status === 401 || errorMessage.includes("no registrado")) {
      error.code = "NOT_REGISTERED";
    } else if (response.status === 403 || errorMessage.includes("consent")) {
      error.code = "CONSENT_DENIED";
    } else if (response.status >= 500) {
      error.code = "UPSTREAM_UNAVAILABLE";
    } else {
      error.code = "UNKNOWN";
    }
    throw error;
  }

  return response.json();
}
