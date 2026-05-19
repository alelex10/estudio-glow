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
  isAuthenticated?: boolean;
  token?: string | null;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({
  children,
  serverFavoriteIds = [],
  isAuthenticated = false,
  token,
}: FavoritesProviderProps) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    new Set(serverFavoriteIds),
  );
  const [isLoading, setIsLoading] = useState(false);

  const readLocalStorage = (): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("glow_favorites");
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return new Set(parsed);
      }
    } catch {
      // ignore parse errors
    }
    return new Set();
  };

  // Gate favorites source by authentication state.
  // Authenticated: server is the source of truth (avoids ghost favorites after logout).
  // Anonymous: read from localStorage for continuity.
  useEffect(() => {
    if (isAuthenticated) {
      setFavoriteIds(new Set(serverFavoriteIds));
    } else {
      setFavoriteIds(readLocalStorage());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, serverFavoriteIds]);

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
