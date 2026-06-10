"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  addToWishlist as addToWishlistAction,
  getWishlist,
  isInWishlist as isInWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
} from "@/actions/wishlist";
import { createClient } from "@/lib/supabase/client";
import type { WishlistItem } from "@/types/database";

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsLoggedIn(!!user);

    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const result = await getWishlist();
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
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string) => {
      if (!isLoggedIn) {
        toast.error("Please login to add to wishlist");
        return false;
      }

      const result = await addToWishlistAction(productId);
      if (result.success) {
        await refresh();
        toast.success("Added to wishlist");
        return true;
      }
      toast.error(result.error || "Failed to add to wishlist");
      return false;
    },
    [isLoggedIn, refresh]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      const result = await removeFromWishlistAction(productId);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.product_id !== productId));
        toast.success("Removed from wishlist");
        return true;
      }
      toast.error(result.error || "Failed to remove");
      return false;
    },
    []
  );

  const toggleItem = useCallback(
    async (productId: string) => {
      const exists = items.some((i) => i.product_id === productId);
      if (exists) {
        return removeItem(productId);
      }
      return addItem(productId);
    },
    [items, addItem, removeItem]
  );

  const checkIsWishlisted = useCallback(async (productId: string) => {
    const result = await isInWishlistAction(productId);
    return result.success ? !!result.data : false;
  }, []);

  return {
    items,
    count: items.length,
    loading,
    isLoggedIn,
    addItem,
    removeItem,
    toggleItem,
    checkIsWishlisted,
    refresh,
    productIds: items.map((i) => i.product_id),
  };
}
