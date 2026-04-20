import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { UUID } from "crypto";
import { apiClient } from "../config/api-client";
import { API_ENDPOINTS } from "../config/api-end-points";
import { productService } from "../services/productService";

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
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: UUID | string) => void;
  updateQuantity: (productId: UUID | string, quantity: number) => void;
  refreshStock: () => Promise<void>;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const stored = localStorage.getItem("glow_cart");
        if (stored) {
          const parsedItems = JSON.parse(stored);

          // Load real stock from backend for all items
          const itemsWithRealStock = await Promise.all(
            parsedItems.map(async (item: CartItem) => {
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
              // Fallback to existing stock or 999
              return { ...item, stock: item.stock ?? 999 };
            }),
          );

          setItems(itemsWithRealStock);
        }
      } catch (e) {
        console.error(e);
      }
      setIsInitialized(true);
    };

    loadCart();
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("glow_cart", JSON.stringify(items));
      // Optional: If user is authed, call sync API here.
    }
  }, [items, isInitialized]);

  const addToCart = (newItem: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === newItem.productId,
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex].quantity += newItem.quantity || 1;
        return next;
      }
      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
    });
  };

  const removeFromCart = async (productId: UUID | string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    try {
      await apiClient({
        endpoint: API_ENDPOINTS.CART.REMOVE(productId.toString()),
        options: { method: "DELETE" },
      });
    } catch (e) {
      console.log(
        "Failed to remove cart items from backend, or user is guest.",
      );
    }
  };

  const updateQuantity = (productId: UUID | string, quantity: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;

      if (quantity <= 0) {
        removeFromCart(productId);
        return prev;
      }

      if (item.stock !== undefined && quantity > item.stock) {
        return prev;
      }

      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i,
      );
    });
  };

  const clearCart = () => setItems([]);

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
        totalItems,
        totalPrice,
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
