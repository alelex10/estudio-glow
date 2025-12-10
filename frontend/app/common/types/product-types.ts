// ========== PRODUCTOS ==========
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: {
    id: number;
    name: string;
  };
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: number;
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

// ========== CATEGORIAS ==========
export interface Category {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}
