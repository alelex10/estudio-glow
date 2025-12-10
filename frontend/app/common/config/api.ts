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
    PRODUCTS: {
      GET_ID: (id: number | string) => `/products/${id}`,
      GET_PAGINATED: "/products/paginated",
      SEARCH: "products/search",
      FILTER: "products/filter",
    },
    CATEGORIES: {
      GET: "/categories",
    },
  },
} as const;
