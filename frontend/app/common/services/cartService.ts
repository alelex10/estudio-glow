import { API_ENDPOINTS } from "../config/api-end-points";
import { apiClient } from "../config/api-client";

interface CartItemInput {
  productId: string;
  quantity: number;
}

interface ServerCartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

interface ServerCart {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: ServerCartItem[];
}

interface CartResponse {
  data: ServerCart;
  message: string;
}

/**
 * Servicio de carrito
 * Maneja operaciones del carrito con el backend
 */
class CartService {
  getCart = (token?: string) =>
    apiClient<CartResponse>({
      endpoint: API_ENDPOINTS.CART.GET,
      token,
    });

  addCartItem = (productId: string, quantity: number, token?: string) =>
    apiClient<CartResponse>({
      endpoint: API_ENDPOINTS.CART.ADD,
      token,
      options: {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      },
    });

  updateCartItem = (productId: string, quantity: number, token?: string) =>
    apiClient<CartResponse>({
      endpoint: API_ENDPOINTS.CART.UPDATE(productId),
      token,
      options: {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      },
    });

  removeCartItem = (productId: string, token?: string) =>
    apiClient<CartResponse>({
      endpoint: API_ENDPOINTS.CART.REMOVE(productId),
      token,
      options: {
        method: "DELETE",
      },
    });

  syncCart = (items: CartItemInput[], token?: string) =>
    apiClient<CartResponse>({
      endpoint: API_ENDPOINTS.CART.SYNC,
      token,
      options: {
        method: "POST",
        body: JSON.stringify({ items }),
      },
    });
}

export const cartService = new CartService();
