"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getCart, mergeGuestCartOnLogin, saveCart } from "@/actions/cart";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/types/database";

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => Promise<void>;
  removeItem: (productId: string, size?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, size?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await getCart();
    if (result.success && result.data) {
      setItems(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        await mergeGuestCartOnLogin();
      }
      await refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const persist = useCallback(async (nextItems: CartItem[]) => {
    setItems(nextItems);
    await saveCart(nextItems);
  }, []);

  const addItem = useCallback(
    async (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qty = item.quantity ?? 1;
      const existing = items.find(
        (i) => i.productId === item.productId && i.size === item.size
      );

      let next: CartItem[];
      if (existing) {
        next = items.map((i) =>
          i.productId === item.productId && i.size === item.size
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      } else {
        next = [...items, { ...item, quantity: qty }];
      }

      await persist(next);
    },
    [items, persist]
  );

  const removeItem = useCallback(
    async (productId: string, size?: string) => {
      const next = items.filter(
        (i) => !(i.productId === productId && i.size === size)
      );
      await persist(next);
    },
    [items, persist]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, size?: string) => {
      if (quantity <= 0) {
        await removeItem(productId, size);
        return;
      }

      const next = items.map((i) =>
        i.productId === productId && i.size === size ? { ...i, quantity } : i
      );
      await persist(next);
    },
    [items, persist, removeItem]
  );

  const clearCart = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      refresh,
    }),
    [items, loading, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return ctx;
}
