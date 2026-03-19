// ========== PRODUCTOS ==========
export interface Product {
  id: number;
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

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: {
    id: string;
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
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}
