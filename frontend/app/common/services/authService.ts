import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { LoginCredentials, RegisterData, LoginResponse, MessageResponse, User } from '../types';

/**
 * Servicio de autenticación
 * Maneja login, registro y logout con el backend
 */
class AuthService {
  private baseUrl = API_BASE_URL;

  /**
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Importante para cookies
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    return response.json();
  }

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterData): Promise<MessageResponse> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrar usuario');
    }

    return response.json();
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<MessageResponse> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al cerrar sesión');
    }

    return response.json();
  }

  /**
   * Obtener usuario almacenado en localStorage
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Guardar usuario en localStorage
   */
  storeUser(user: User): void {
    localStorage.setItem('admin_user', JSON.stringify(user));
  }

  /**
   * Eliminar usuario de localStorage
   */
  clearStoredUser(): void {
    localStorage.removeItem('admin_user');
  }

  /**
   * Verificar si hay una sesión activa
   */
  isAuthenticated(): boolean {
    return this.getStoredUser() !== null;
  }

  /**
   * Verificar si el usuario es admin
   */
  isAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.role === 'admin';
  }
}

export const authService = new AuthService();
