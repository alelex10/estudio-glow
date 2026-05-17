// Re-export Stats from the canonical source to avoid duplication
export type { Stats } from "./dashboard";

type UUID = string;

// ========== PRODUCTOS ==========
// Aligned with backend ProductResponse schema (openapi.json).
// Key changes from the previous version:
//   - description: string | null  (backend schema: nullable)
//   - imageUrl:    string | null  (backend schema: nullable)
//   - category:    { id, name } | null  (backend sends the nested object, not categoryId)
//   - removed:     categoryId field (not present in the GET response)
export interface Product {
  id: UUID;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse extends Product {}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
}

export interface SearchProductParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

// ========== CATEGORIAS ==========
export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
