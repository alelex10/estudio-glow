import { API_ENDPOINTS } from "../config/api-end-points";
import { apiClient } from "../config/api-client";
import { tokenContext, contextProvider } from "../context/context";
import type { LoginCredentials, RegisterData, User } from "../types/user-types";
import type { LoginResponse, MessageResponse } from "../types/response";

/**
 * Servicio de autenticación
 * Maneja login, registro y logout con el backend
 */
class AuthService {
  login = async (credentials: LoginCredentials): Promise<Response> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al iniciar sesión");
    }

    return response;
  };

  register = (data: RegisterData) =>
    apiClient<MessageResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
    });

  logout = () =>
    apiClient<MessageResponse>(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
    });

  isAuthenticated = () =>
    apiClient<MessageResponse>(API_ENDPOINTS.AUTH.VERIFY, {
      method: "GET",
    });

}

export const authService = new AuthService();
