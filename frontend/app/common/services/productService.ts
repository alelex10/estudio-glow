import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
import type { Category, ProductResponse } from "../types/product-types";
import type { PaginationResponse, ResponseSchema } from "../types/response";
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  SearchProductParams,
} from "../types/product-types";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ProductService {
  private baseUrl = API_BASE_URL;

  async getNewProducts(): Promise<ResponseSchema<Product[]>> {
    console.log("Fetching new products...");
    // await delay(1000); // Simulate network delay
    const response = await fetch(
      `${this.baseUrl}/${API_ENDPOINTS.PUBLIC.PRODUCTS.GET_NEW_PRODUCTS}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const error = await response.json();
    }

    return response.json();
  }

  async getProductsPaginated(
    page: number,
    limit: number
  ): Promise<PaginationResponse<ProductResponse>> {
    console.log("Fetching products...");
    // await delay(1000);
    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.PUBLIC.PRODUCTS.GET_PAGINATED}?page=${page}&limit=${limit}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          data: [],
          pagination: {
            page: 0,
            limit: 0,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
      const error = await response.json();
      throw new Error(error.message || "Error al obtener productos");
    }

    return response.json();
  }

  async getProductsFilter(
    page?: number,
    limit?: number,
    category?: string,
    sortOrder?: string,
    sortBy?: string
  ): Promise<PaginationResponse<Product>> {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (category) params.append("category", category);
    if (sortOrder) params.append("sortOrder", sortOrder);
    if (sortBy) params.append("sortBy", sortBy);
    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.PUBLIC.PRODUCTS.FILTER}?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          data: [],
          pagination: {
            page: 0,
            limit: 0,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
      const error = await response.json();
      throw new Error(error.message || "Error al obtener productos");
    }

    return response.json();
  }

  /**
   * Obtener un producto por ID
   */
  async getProduct(
    id: number | string
  ): Promise<ResponseSchema<ProductResponse>> {
    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.PUBLIC.PRODUCTS.GET_ID(id)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener producto");
    }

    return response.json();
  }

  /**
   * Crear un nuevo producto con imagen
   */
  async createProduct(data: CreateProductData, image: File): Promise<Product> {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("price", data.price.toString());
    formData.append("stock", data.stock.toString());
    formData.append("categoryId", data.categoryId.toString());
    if (data.description) {
      formData.append("description", data.description);
    }
    formData.append("image", image);

    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.ADMIN.PRODUCTS.CREATE}`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear producto");
    }

    return response.json();
  }

  /**
   * Actualizar un producto existente
   */
  async updateProduct(
    id: number | string,
    data: UpdateProductData,
    image?: File
  ): Promise<Product> {
    const formData = new FormData();

    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.price !== undefined)
      formData.append("price", data.price.toString());
    if (data.stock !== undefined)
      formData.append("stock", data.stock.toString());
    if (data.categoryId !== undefined)
      formData.append("categoryId", data.categoryId.toString());
    if (image) formData.append("image", image);

    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.ADMIN.PRODUCTS.EDIT(id)}`,
      {
        method: "PUT",
        credentials: "include",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al actualizar producto");
    }

    return response.json();
  }

  /**
   * Eliminar un producto
   */
  async deleteProduct(id: number | string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.ADMIN.PRODUCTS.DELETE(id)}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al eliminar producto");
    }

    return response.json();
  }

  /**
   * Buscar productos con filtros
   */
  async searchProducts(params: SearchProductParams): Promise<Product[]> {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.append("q", params.q);
    if (params.category) queryParams.append("category", params.category);
    if (params.minPrice)
      queryParams.append("minPrice", params.minPrice.toString());
    if (params.maxPrice)
      queryParams.append("maxPrice", params.maxPrice.toString());

    const url = `${this.baseUrl}${API_ENDPOINTS.PUBLIC.PRODUCTS.SEARCH}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error en la búsqueda");
    }

    return response.json();
  }

  /**
   * Obtener categorías únicas de los productos
   */
  async getCategories(): Promise<ResponseSchema<Category[]>> {
    const response = await fetch(
      `${this.baseUrl}${API_ENDPOINTS.PUBLIC.CATEGORIES.GET}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener categorías");
    }

    return response.json();
  }

  /**
   * Obtener estadísticas de productos
   */
  async getProductStats(): Promise<{
    total: number;
    lowStock: number;
    outOfStock: number;
    categories: number;
    totalValue: number;
  }> {
    const products = await this.getProductsPaginated(1, 100);

    return {
      total: products.data.length,
      lowStock: products.data.filter((p) => p.stock > 0 && p.stock <= 10)
        .length,
      outOfStock: products.data.filter((p) => p.stock === 0).length,
      categories: new Set(products.data.map((p) => p.category.name)).size,
      totalValue: products.data.reduce((acc, p) => acc + p.price * p.stock, 0),
    };
  }
}

export const productService = new ProductService();
