import { API_ENDPOINTS } from "../config/api-end-points";
import { apiClient } from "../config/api-client";
import type { LoginCredentials, RegisterData } from "../types/user-types";
import type {  LoginResponse, MessageResponse } from "../types/response";

/**
 * Servicio de autenticación
 * Maneja login, registro y logout con el backend
 */
class AuthService {
  login = (data: LoginCredentials) => {
    return apiClient<LoginResponse>({
      options: {
        method: "POST",
        body: JSON.stringify(data),
      },
      endpoint: API_ENDPOINTS.AUTH.LOGIN,
    });
  }

  register = (data: RegisterData) =>
    apiClient<MessageResponse>({
      options: {
        method: "POST",
        body: JSON.stringify(data),
      },
      endpoint: API_ENDPOINTS.AUTH.REGISTER,
    });

  logout = () =>
    apiClient({
      options: {
        method: "POST",
      },
      endpoint: API_ENDPOINTS.AUTH.LOGOUT,
    });


}

export const authService = new AuthService();
