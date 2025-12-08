// Configuración de la API
export const API_BASE_URL = 'http://localhost:3000';

// Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },
  // Admin Products
  ADMIN: {
    PRODUCTS: '/admin/products',
    PRODUCT: (id: number | string) => `/admin/products/${id}`,
    SEARCH: '/admin/search',
  },
  // Public Products
  PUBLIC: {
    PRODUCTS: '/public/products/paginated',
    PRODUCT: (id: number | string) => `/public/products/${id}`,
    SEARCH: '/public/search',
  },
} as const;
