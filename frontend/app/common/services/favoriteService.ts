import { API_ENDPOINTS } from "../config/api-end-points";
import { apiClient } from "../config/api-client";
import type { FavoriteItem } from "../types/user-types";
import type { MessageResponse } from "../types/response";
import type { UUID } from "crypto";

interface FavoritesResponse {
  data: FavoriteItem[];
}

interface FavoriteIdsResponse {
  data: UUID[];
}

/**
 * Servicio de favoritos
 * Maneja operaciones CRUD de favoritos con el backend
 */
class FavoriteService {
  list = (token: string) =>
    apiClient<FavoritesResponse>({
      endpoint: API_ENDPOINTS.FAVORITES.LIST,
      token,
    });

  add = (productId: string, token: string) =>
    apiClient<MessageResponse>({
      endpoint: API_ENDPOINTS.FAVORITES.ADD(productId),
      options: {
        method: "POST",
      },
      token,
    });

  remove = (productId: string, token: string) =>
    apiClient<MessageResponse>({
      endpoint: API_ENDPOINTS.FAVORITES.REMOVE(productId),
      options: {
        method: "DELETE",
      },
      token,
    });

  getIds = (token: string) =>
    apiClient<FavoriteIdsResponse>({
      endpoint: API_ENDPOINTS.FAVORITES.IDS,
      token,
    });
}

export const favoriteService = new FavoriteService();
