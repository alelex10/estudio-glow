import type { ErrorResponse } from "../types/response";
import { API_BASE_URL } from "./api-end-points";

interface ApiClientProps {
  token?: string;
  endpoint: string;
  options?: RequestInit;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly response: ErrorResponse;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    response: ErrorResponse,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.response = response;
  }
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
      "X-Requested-With": "XMLHttpRequest",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    if (response.status === 404) {
      console.error(`Endpoint ${endpoint} not found at ${url}`);
    }
    const responseError: ErrorResponse = await response.json().catch(() => ({
      error: {
        code: "UNKNOWN_ERROR",
        message: `Error: ${response.status}`,
      },
    }));
    console.error("API Error:", responseError);
    throw new ApiError(
      responseError.error.message || `Error: ${response.status}`,
      response.status,
      responseError.error.code ?? "UNKNOWN_ERROR",
      responseError,
    );
  }

  return response.json();
}
