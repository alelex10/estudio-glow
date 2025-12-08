// Configuración de la API
export const API_BASE_URL = "http://localhost:3000";

// Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
  },
  // Admin Products
  ADMIN: {
    PRODUCTS: {
      EDIT: (id: number | string) => `/products/${id}`,
      CREATE: "/products",
      DELETE: (id: number | string) => `/products/${id}`,
    },
    CATEGORIES: {
      EDIT: (id: number | string) => `/categories/${id}`,
      CREATE: "/categories",
      DELETE: (id: number | string) => `/categories/${id}`,
    },
  },
  // Public Products
  PUBLIC: {
    PRODUCT: (id: number | string) => `/products/${id}`,
    PRODUCTS: "/products/paginated",
    SEARCH: "/search",
  },
} as const;
