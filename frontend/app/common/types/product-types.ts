import type { UUID } from "crypto";

// ========== PRODUCTOS ==========
export interface Product {
  id: UUID;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  total: number;
  lowStock: number;
  outOfStock: number;
  categories: number;
  totalValue: number;
}

export interface ProductResponse extends Product {
  category: {
    id: UUID;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

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
