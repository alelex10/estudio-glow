import { contextProvider, tokenContext } from "../context/context";
import type { ErrorResponse } from "../types/response";
import { API_BASE_URL } from "./api-end-points";

export async function apiClientResponse(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const token = contextProvider.get(tokenContext);
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...(options?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  return response;
}
