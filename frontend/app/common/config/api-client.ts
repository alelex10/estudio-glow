import type { ErrorResponse } from "../types/response";
import { API_BASE_URL } from "./api-end-points";

interface ApiClientProps {
  token?: string;
  endpoint: string;
  options?: RequestInit;
}

export async function apiClient<T>({
  token,
  endpoint,
  options,
}: ApiClientProps): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const responseError: ErrorResponse = await response.json().catch(() => ({
      error: {
        message: "Unknown error",
        statusCode: response.status,
        error: "Unknown error",
      },
    }));
    console.error("API Error:", responseError);
    throw new Error(responseError.error.message || `Error: ${response.status}`);
  }

  return response.json();
}
