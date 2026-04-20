// Configuración de la API - soporta tanto cliente como SSR
const getApiBaseUrl = () => {
  // Cliente: usar VITE_API_BASE_URL
  if (typeof window !== "undefined") {
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  }
  // SSR: intentar process.env primero, luego import.meta.env, con fallback a localhost
  return process.env.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
};

export const API_BASE_URL = getApiBaseUrl();

// Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    VERIFY: "/auth/verify",
    GOOGLE: "/auth/google",
  },
  // Users
  USERS: {
    ME: "/users/me",
  },
  // Favorites
  FAVORITES: {
    LIST: "/favorites",
    IDS: "/favorites/ids",
    ADD: (productId: string) => `/favorites/${productId}`,
    REMOVE: (productId: string) => `/favorites/${productId}`,
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
    DASHBOARD: {
      STATS: "/dashboard/stats",
    },
  },
  // Public Products
  PUBLIC: {
    PRODUCTS: {
      GET_ID: (id: number | string) => `/products/${id}`,
      GET_PAGINATED: "/products/paginated",
      SEARCH: "/products/search",
      GET_NEW_PRODUCTS: "/products/news",
      FILTER: "/products/filter",
    },
    CATEGORIES: {
      GET: "/categories",
    },
  },
  // Cart
  CART: {
    GET: "/cart",
    SYNC: "/cart/sync",
    REMOVE: (productId: string) => `/cart/${productId}`,
  },
  // Checkout
  CHECKOUT: {
    MERCADO_PAGO: "/checkout/mercadopago",
    TRANSFER: "/checkout/transfer",
  },
} as const;
