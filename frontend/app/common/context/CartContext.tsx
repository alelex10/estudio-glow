import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { UUID } from "crypto";
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

interface CartProviderProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, isAuthenticated = false }: CartProviderProps) {
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
    }
  }, [items, isInitialized]);

  const addToCart = (newItem: CartItem) => {
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
  };

  const removeFromCart = (productId: UUID | string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: UUID | string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;

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
