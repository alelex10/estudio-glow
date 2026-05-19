import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { UUID } from "crypto";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { toast } from "../components/Toast";

export interface CartItem {
  productId: UUID | string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  stock?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (productId: UUID | string) => Promise<void>;
  updateQuantity: (productId: UUID | string, quantity: number) => Promise<void>;
  refreshStock: () => Promise<void>;
  clearCart: () => void;
  isProductPending: (productId: UUID | string) => boolean;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
}

interface CartProviderProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
  token?: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, isAuthenticated = false, token }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  // Visual-only "syncing" flag per product (does NOT block clicks).
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(
    () => new Set(),
  );

  // Refs used by the debounced background sync — they read the latest values
  // without re-creating the callback on every state change.
  const itemsRef = useRef<CartItem[]>([]);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const tokenRef = useRef(token);
  const syncTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const inFlightRef = useRef<Set<string>>(new Set());
  const dirtyRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const markPending = useCallback((productId: UUID | string) => {
    setPendingProductIds((prev) => {
      const next = new Set(prev);
      next.add(String(productId));
      return next;
    });
  }, []);

  const clearPending = useCallback((productId: UUID | string) => {
    setPendingProductIds((prev) => {
      if (!prev.has(String(productId))) return prev;
      const next = new Set(prev);
      next.delete(String(productId));
      return next;
    });
  }, []);

  const isProductPending = useCallback(
    (productId: UUID | string) => pendingProductIds.has(String(productId)),
    [pendingProductIds],
  );

  const loadFromLocalStorage = useCallback(async (): Promise<CartItem[]> => {
    try {
      const stored = localStorage.getItem("glow_cart");
      if (!stored) return [];
      const parsedItems: CartItem[] = JSON.parse(stored);

      const itemsWithRealStock = await Promise.all(
        parsedItems.map(async (item) => {
          try {
            const productResponse = await productService.getProduct(
              item.productId,
            );
            if (productResponse.data?.stock !== undefined) {
              return { ...item, stock: productResponse.data.stock };
            }
          } catch (e) {
            console.error(
              `Failed to load stock for product ${item.productId}`,
              e,
            );
          }
          return { ...item, stock: item.stock ?? 999 };
        }),
      );

      return itemsWithRealStock;
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
      return [];
    }
  }, []);

  const mapServerCartItems = useCallback(
    async (
      serverItems: { productId: string; quantity: number }[],
    ): Promise<CartItem[]> => {
      const enriched = await Promise.all(
        serverItems.map(async (si) => {
          try {
            const res = await productService.getProduct(si.productId);
            const product = res.data;
            if (product) {
              return {
                productId: si.productId,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl ?? undefined,
                quantity: si.quantity,
                stock: product.stock,
              } as CartItem;
            }
          } catch (e) {
            console.error(`Failed to load product ${si.productId}`, e);
          }
          return null;
        }),
      );
      return enriched.filter((item): item is CartItem => item !== null);
    },
    [],
  );

  // Sends the CURRENT local quantity for a product to the server. Coalesces
  // concurrent calls: if a request is already in flight for this product, marks
  // it dirty and re-flushes when the in-flight one resolves.
  const flushSync = useCallback(
    async (productId: string) => {
      if (!isAuthenticatedRef.current) return;

      if (inFlightRef.current.has(productId)) {
        dirtyRef.current.add(productId);
        return;
      }

      inFlightRef.current.add(productId);
      dirtyRef.current.delete(productId);
      markPending(productId);
      setIsSyncing(true);

      const tok = tokenRef.current ?? undefined;
      try {
        const item = itemsRef.current.find(
          (i) => String(i.productId) === productId,
        );
        const res =
          item && item.quantity > 0
            ? await cartService.addCartItem(productId, item.quantity, tok)
            : await cartService.removeCartItem(productId, tok);

        // Only adopt server state if no newer click landed mid-flight.
        // Otherwise local optimistic state is more recent — let the re-sync
        // below reconcile.
        if (!dirtyRef.current.has(productId)) {
          const enriched = await mapServerCartItems(res.data.items);
          setItems(enriched);
        }
        setError(null);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Error al sincronizar el carrito";
        setError(msg);
        toast("error", msg);
        // Recover canonical state from the server so local doesn't drift.
        try {
          const res = await cartService.getCart(tok);
          const enriched = await mapServerCartItems(res.data.items);
          setItems(enriched);
        } catch {
          /* keep local state */
        }
      } finally {
        inFlightRef.current.delete(productId);
        clearPending(productId);
        setIsSyncing(inFlightRef.current.size > 0);

        if (dirtyRef.current.has(productId)) {
          void flushSync(productId);
        }
      }
    },
    [mapServerCartItems, markPending, clearPending],
  );

  // Debounces user input: keeps resetting the timer until the user stops
  // clicking for ~400ms, then fires a single sync with the final quantity.
  const scheduleSync = useCallback(
    (productId: UUID | string) => {
      if (!isAuthenticatedRef.current) return;
      const key = String(productId);
      dirtyRef.current.add(key);

      const existing = syncTimersRef.current.get(key);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        syncTimersRef.current.delete(key);
        void flushSync(key);
      }, 400);
      syncTimersRef.current.set(key, timer);
    },
    [flushSync],
  );

  // Clean up any pending timers on unmount.
  useEffect(() => {
    return () => {
      syncTimersRef.current.forEach((t) => clearTimeout(t));
      syncTimersRef.current.clear();
    };
  }, []);

  // Handle auth changes and initial load
  useEffect(() => {
    const load = async () => {
      if (isAuthenticated) {
        if (isInitialized) {
          // Transition from guest → auth: sync localStorage then fetch server cart
          const stored = localStorage.getItem("glow_cart");
          if (stored) {
            const localItems: CartItem[] = JSON.parse(stored);
            if (localItems.length > 0) {
              setIsSyncing(true);
              setError(null);
              try {
                const res = await cartService.syncCart(
                  localItems.map((item) => ({
                    productId: String(item.productId),
                    quantity: item.quantity,
                  })),
                  token ?? undefined,
                );
                localStorage.removeItem("glow_cart");
                const enriched = await mapServerCartItems(res.data.items);
                setItems(enriched);
                setError(null);
                toast("success", "Carrito sincronizado con tu cuenta");
              } catch (e) {
                const msg =
                  e instanceof Error
                    ? e.message
                    : "Error al sincronizar el carrito";
                setError(msg);
                toast("error", msg);
              } finally {
                setIsSyncing(false);
              }
              return;
            }
          }

          // No local items to sync, just fetch server cart
          setIsLoading(true);
          setError(null);
          try {
            const res = await cartService.getCart(token ?? undefined);
            const enriched = await mapServerCartItems(res.data.items);
            setItems(enriched);
            setError(null);
          } catch (e) {
            const msg =
              e instanceof Error
                ? e.message
                : "Error al cargar el carrito";
            setError(msg);
            toast("error", msg);
          } finally {
            setIsLoading(false);
          }
        } else {
          // First mount as auth
          setIsLoading(true);
          setError(null);
          try {
            const res = await cartService.getCart(token ?? undefined);
            const enriched = await mapServerCartItems(res.data.items);
            setItems(enriched);
            setError(null);
          } catch (e) {
            const msg =
              e instanceof Error
                ? e.message
                : "Error al cargar el carrito";
            setError(msg);
            toast("error", msg);
          } finally {
            setIsLoading(false);
            setIsInitialized(true);
          }
        }
      } else {
        // Guest mode
        if (isInitialized) {
          // Transition from auth → guest
          setItems([]);
          setError(null);
          const localItems = await loadFromLocalStorage();
          setItems(localItems);
        } else {
          // First mount as guest
          const localItems = await loadFromLocalStorage();
          setItems(localItems);
          setIsInitialized(true);
        }
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Persist to localStorage for guests
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      localStorage.setItem("glow_cart", JSON.stringify(items));
    }
  }, [items, isInitialized, isAuthenticated]);

  const addToCart = useCallback(
    async (newItem: CartItem) => {
      if (newItem.stock !== undefined && newItem.stock <= 0) return;

      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.productId === newItem.productId,
        );
        if (existingIndex >= 0) {
          return prev.map((i) => {
            if (i.productId !== newItem.productId) return i;
            const addedQty = newItem.quantity || 1;
            const desiredQty = i.quantity + addedQty;
            const cappedQty =
              i.stock !== undefined && desiredQty > i.stock
                ? i.stock
                : desiredQty;
            return { ...i, quantity: cappedQty };
          });
        }
        return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
      });

      scheduleSync(newItem.productId);
    },
    [scheduleSync],
  );

  const removeFromCart = useCallback(
    async (productId: UUID | string) => {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      scheduleSync(productId);
    },
    [scheduleSync],
  );

  const updateQuantity = useCallback(
    async (productId: UUID | string, quantity: number) => {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      setItems((prev) => {
        const item = prev.find((i) => i.productId === productId);
        if (!item) return prev;
        if (item.stock !== undefined && quantity > item.stock) return prev;
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity } : i,
        );
      });

      scheduleSync(productId);
    },
    [removeFromCart, scheduleSync],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setError(null);
    if (!isAuthenticated) {
      localStorage.removeItem("glow_cart");
    }
  }, [isAuthenticated]);

  const refreshStock = useCallback(async () => {
    if (items.length === 0) return;

    const itemsWithRealStock = await Promise.all(
      items.map(async (item) => {
        try {
          const productResponse = await productService.getProduct(
            item.productId,
          );
          if (productResponse.data?.stock !== undefined) {
            return { ...item, stock: productResponse.data.stock };
          }
        } catch (e) {
          console.error(
            `Failed to load stock for product ${item.productId}`,
            e,
          );
        }
        return item;
      }),
    );

    setItems(itemsWithRealStock);
  }, [items]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        refreshStock,
        clearCart,
        isProductPending,
        totalItems,
        totalPrice,
        isLoading,
        isSyncing,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
