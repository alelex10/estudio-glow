import type { ErrorResponse } from "../types/response";
import { API_BASE_URL } from "./api-end-points";

// services/api-client.ts
export async function apiClientTest<T>(
  endpoint: string,
  options?: RequestInit,
  request?: Request
): Promise<T> {
  const Cookie = request?.headers.get("Cookie") || "";

  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      Cookie,
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
    throw new Error(responseError.error.message || `Error: ${response.status}`);
  }

  return response.json();
}
