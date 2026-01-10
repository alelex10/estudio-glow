import { API_ENDPOINTS } from "../config/api";
import { apiClient } from "../config/api-client";
import { tokenContext, tokenContextProvider } from "../context/context";
import type { LoginCredentials, RegisterData, User } from "../types/user-types";
import type { LoginResponse, MessageResponse } from "../types/response";

/**
 * Servicio de autenticación
 * Maneja login, registro y logout con el backend
 */
class AuthService {
  login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
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

    tokenContextProvider.set(tokenContext, response.headers.get("set-cookie"));

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al iniciar sesión");
    }

    return response.json();
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

  getStoredUser = (): User | null => {
    const userStr = localStorage.getItem("admin_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  };

  storeUser = (user: User): void => {
    localStorage.setItem("admin_user", JSON.stringify(user));
  };

  clearStoredUser = (): void => {
    localStorage.removeItem("admin_user");
  };

  isAuthenticated = (): boolean => this.getStoredUser() !== null;

  isAdmin = (): boolean => {
    const user = this.getStoredUser();
    return user?.role === "admin";
  };
}

export const authService = new AuthService();
