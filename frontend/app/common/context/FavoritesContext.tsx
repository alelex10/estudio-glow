import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { favoriteService } from "~/common/services/favoriteService";
import { toast } from "~/common/components/Toast";

export interface FavoritesContextType {
  isFav: (productId: string) => boolean;
  favoriteCount: number;
  toggleFavorite: (productId: string) => Promise<void>;
  isLoading: boolean;
}

interface FavoritesProviderProps {
  children: React.ReactNode;
  serverFavoriteIds?: string[];
  token?: string | null;
  isAuthenticated?: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({
  children,
  serverFavoriteIds = [],
  token = null,
  isAuthenticated = false,
}: FavoritesProviderProps) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    new Set(serverFavoriteIds),
  );
  const [isLoading, setIsLoading] = useState(false);

  // On client mount: read localStorage as warm cache only if server data is empty
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (serverFavoriteIds.length === 0) {
      try {
        const stored = localStorage.getItem("glow_favorites");
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          setFavoriteIds(new Set(parsed));
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [serverFavoriteIds.length]);

  const isFav = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds],
  );

  const favoriteCount = favoriteIds.size;

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        toast("info", "Iniciá sesión para guardar favoritos");
        return;
      }

      if (isLoading) return;

      const prev = new Set(favoriteIds);
      const next = new Set(favoriteIds);
      const adding = !prev.has(productId);

      if (adding) {
        next.add(productId);
      } else {
        next.delete(productId);
      }

      setFavoriteIds(next);
      setIsLoading(true);

      try {
        if (adding) {
          await favoriteService.add(productId, token ?? undefined);
          toast("success", "Agregado a favoritos");
        } else {
          await favoriteService.remove(productId, token ?? undefined);
          toast("success", "Eliminado de favoritos");
        }

        if (typeof window !== "undefined") {
          localStorage.setItem(
            "glow_favorites",
            JSON.stringify(Array.from(next)),
          );
        }
      } catch {
        setFavoriteIds(prev);
        toast("error", "Error al actualizar favoritos");
      } finally {
        setIsLoading(false);
      }
    },
    [favoriteIds, isLoading, isAuthenticated, token],
  );

  return (
    <FavoritesContext.Provider
      value={{ isFav, favoriteCount, toggleFavorite, isLoading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
