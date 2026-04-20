import { apiClient } from "../config/api-client";
import type { PaginationResponse, ResponseSchema } from "../types/response";

class OrderService {
  private emptyPagination = (): PaginationResponse<any> => ({
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

  getOrdersPaginated = (
    page: number,
    limit: number,
    status?: string,
    paymentMethod?: string,
    sortBy?: string,
    sortOrder?: string,
    token?: string
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (status) params.append("status", status);
    if (paymentMethod) params.append("paymentMethod", paymentMethod);
    if (sortBy) params.append("sortBy", sortBy);
    if (sortOrder) params.append("sortOrder", sortOrder);

    return apiClient<PaginationResponse<any>>({
      endpoint: `/orders?${params.toString()}`,
      token,
    }).catch((err) => {
      if (err.message.includes("404")) return this.emptyPagination();
      throw err;
    });
  };

  getOrderDetail = (id: string, token?: string) => {
    return apiClient<any>({
      endpoint: `/users/orders/${id}`,
      token,
    });
  };

  getAdminOrderDetail = (id: string, token?: string) => {
    return apiClient<any>({
      endpoint: `/orders/${id}`,
      token,
    });
  };

  getUserOrders = (
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: string,
    token?: string
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (sortBy) params.append("sortBy", sortBy);
    if (sortOrder) params.append("sortOrder", sortOrder);

    return apiClient<PaginationResponse<any>>({
      endpoint: `/users/orders?${params.toString()}`,
      token,
    }).catch((err) => {
      if (err.message.includes("404")) return this.emptyPagination();
      throw err;
    });
  };
}

export const orderService = new OrderService();
