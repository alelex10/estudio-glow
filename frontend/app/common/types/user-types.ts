import type { Product } from "./product-types";

// ========== USUARIOS ==========
const ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  provider?: "LOCAL" | "GOOGLE";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthData {
  idToken: string;
}

// ========== FAVORITOS ==========
export interface FavoriteItem {
  id: string;
  createdAt: string;
  product: Product;
}
