import { apiClient } from "../config/api-client";
import { API_BASE_URL } from "../config/api-end-points";
import type { LoginResponse } from "../types/response";

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
