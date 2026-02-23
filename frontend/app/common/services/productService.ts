import { API_ENDPOINTS } from "../config/api-end-points";
import { apiClient } from "../config/api-client";
import type { Category, ProductResponse, Stats } from "../types/product-types";
import type { PaginationResponse, ResponseSchema } from "../types/response";
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  SearchProductParams,
} from "../types/product-types";

class ProductService {
  private emptyPagination = (): PaginationResponse<ProductResponse> => ({
    data: [],
    pagination: {
      page: 0,
      limit: 0,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });

  getNewProducts = () =>
    apiClient<ResponseSchema<Product[]>>({
      endpoint: API_ENDPOINTS.PUBLIC.PRODUCTS.GET_NEW_PRODUCTS,
    });

  getProductsPaginated = (page: number, limit: number) =>
    apiClient<PaginationResponse<ProductResponse>>({
      endpoint: `${API_ENDPOINTS.PUBLIC.PRODUCTS.GET_PAGINATED}?page=${page}&limit=${limit}`,
    }).catch((err) => {
      if (err.message.includes("404")) return this.emptyPagination();
      throw err;
    });

  getProductsFilter = (
    page?: number,
    limit?: number,
    category?: string,
    sortOrder?: string,
    sortBy?: string
  ) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (category) params.append("category", category);
    if (sortOrder) params.append("sortOrder", sortOrder);
    if (sortBy) params.append("sortBy", sortBy);

    return apiClient<PaginationResponse<Product>>({
      endpoint: `${API_ENDPOINTS.PUBLIC.PRODUCTS.FILTER}?${params.toString()}`,
    }).catch((err) => {
      if (err.message.includes("404")) return this.emptyPagination();
      throw err;
    });
  };

  getProduct = (id: number | string) =>
    apiClient<ResponseSchema<ProductResponse>>({
      endpoint: API_ENDPOINTS.PUBLIC.PRODUCTS.GET_ID(id),
    });

  createProduct = (data: CreateProductData, image: File, token: string) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        formData.append(key, val.toString());
      }
    });
    formData.append("image", image);

    return apiClient<Product>({
      endpoint: API_ENDPOINTS.ADMIN.PRODUCTS.CREATE,
      options: {
        method: "POST",
        body: formData,
      },
      token,
    });
  };

  updateProduct = (
    id: number | string,
    data: UpdateProductData,
    image?: File,
    token?: string
  ) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        formData.append(key, val.toString());
      }
    });

    if (image) formData.append("image", image);

    return apiClient<Product>({
      endpoint: API_ENDPOINTS.ADMIN.PRODUCTS.EDIT(id),
      options: {
        method: "PUT",
        body: formData,
      },
      token,
    });
  };

  deleteProduct = (id: number | string, token: string) =>
    apiClient<{ message: string }>({
      endpoint: API_ENDPOINTS.ADMIN.PRODUCTS.DELETE(id),
      options: {
        method: "DELETE",
      },
      token,
    });

  searchProducts = (params: SearchProductParams) => {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.append("q", params.q);
    if (params.category) queryParams.append("category", params.category);
    if (params.minPrice)
      queryParams.append("minPrice", params.minPrice.toString());
    if (params.maxPrice)
      queryParams.append("maxPrice", params.maxPrice.toString());

    return apiClient<Product[]>({
      endpoint: `${API_ENDPOINTS.PUBLIC.PRODUCTS.SEARCH}?${queryParams.toString()}`,
    });
  };

  getCategories = () =>
    apiClient<ResponseSchema<Category[]>>({
      endpoint: API_ENDPOINTS.PUBLIC.CATEGORIES.GET,
    });

  getProductStats = (token: string) =>
    apiClient<ResponseSchema<Stats>>({
      endpoint: API_ENDPOINTS.ADMIN.DASHBOARD.STATS,
      token,
    });
}

export const productService = new ProductService();
