import { API_ENDPOINTS } from "../config/api-end-points";
import { apiClient } from "../config/api-client";
import type { LoginCredentials, RegisterData } from "../types/user-types";
import type { MessageResponse } from "../types/response";
import { apiClientResponse } from "../config/api-client.response";

/**
 * Servicio de autenticación
 * Maneja login, registro y logout con el backend
 */
class AuthService {
  login = (data: LoginCredentials) => {
    return apiClientResponse(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  register = (data: RegisterData) =>
    apiClient<MessageResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
    });

  logout = () =>
    apiClientResponse(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
    });


}

export const authService = new AuthService();
