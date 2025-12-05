// Tipos compartidos para la aplicación Estudio Glow

// ========== PRODUCTOS ==========
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
}

export interface SearchProductParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

// ========== USUARIOS ==========
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'customer';
}

// ========== RESPUESTAS API ==========
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}
