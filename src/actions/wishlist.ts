"use server";

import { createClient } from "@/lib/supabase/server";
import type { Product, WishlistItem } from "@/types/database";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getWishlist(): Promise<ActionResult<WishlistItem[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select("*, product:products(*, images:product_images(*), inventory(*))")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as WishlistItem[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch wishlist";
    return { success: false, error: message };
  }
}

export async function addToWishlist(productId: string): Promise<ActionResult<WishlistItem>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please login to add to wishlist" };
    }

    const { data, error } = await supabase
      .from("wishlists")
      .upsert({ customer_id: user.id, product_id: productId }, { onConflict: "customer_id,product_id" })
      .select("*, product:products(*, images:product_images(*))")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to add to wishlist" };
    }

    return { success: true, data: data as WishlistItem };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add to wishlist";
    return { success: false, error: message };
  }
}

export async function removeFromWishlist(productId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("customer_id", user.id)
      .eq("product_id", productId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove from wishlist";
    return { success: false, error: message };
  }
}

export async function isInWishlist(productId: string): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, data: false };
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select("id")
      .eq("customer_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: !!data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to check wishlist";
    return { success: false, error: message };
  }
}

export async function getWishlistProducts(): Promise<ActionResult<Product[]>> {
  const result = await getWishlist();
  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }
  const products = result.data
    .map((item) => item.product)
    .filter((p): p is Product => !!p);
  return { success: true, data: products };
}
