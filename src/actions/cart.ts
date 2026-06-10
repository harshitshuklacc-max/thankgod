"use server";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { calculateDiscountedPrice } from "@/lib/utils";
import type { CartItem } from "@/types/database";

const GUEST_CART_COOKIE = "shoe-mafia-cart";
const CART_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function getGuestCart(): Promise<CartItem[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(decodeURIComponent(raw)) as CartItem[];
  } catch {
    return [];
  }
}

async function setGuestCart(items: CartItem[]) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_CART_COOKIE, encodeURIComponent(JSON.stringify(items)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CART_MAX_AGE,
    path: "/",
  });
}

async function fetchCartItemsFromDb(customerId: string): Promise<CartItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cart_items")
    .select("*, product:products(*, images:product_images(*))")
    .eq("customer_id", customerId);

  if (error || !data) return [];

  return data.map((row) => {
    const product = row.product as {
      id: string;
      name: string;
      selling_price: number;
      discount_percent: number;
      barcode?: string | null;
      sku?: string | null;
      images?: { image_url: string; is_primary: boolean }[];
    };
    const primaryImage =
      product.images?.find((img) => img.is_primary) ?? product.images?.[0];
    const price =
      product.discount_percent > 0
        ? calculateDiscountedPrice(product.selling_price, product.discount_percent)
        : product.selling_price;

    return {
      productId: product.id,
      name: product.name,
      price,
      quantity: row.quantity,
      size: row.size ?? undefined,
      image: primaryImage?.image_url,
      barcode: product.barcode ?? undefined,
      sku: product.sku ?? undefined,
    } satisfies CartItem;
  });
}

export async function getCart(): Promise<ActionResult<CartItem[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const items = await fetchCartItemsFromDb(user.id);
      return { success: true, data: items };
    }

    const items = await getGuestCart();
    return { success: true, data: items };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch cart";
    return { success: false, error: message };
  }
}

export async function saveCart(items: CartItem[]): Promise<ActionResult<CartItem[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("cart_items").delete().eq("customer_id", user.id);

      if (items.length > 0) {
        const records = items.map((item) => ({
          customer_id: user.id,
          product_id: item.productId,
          quantity: item.quantity,
          size: item.size ?? null,
        }));

        const { error } = await supabase.from("cart_items").insert(records);
        if (error) {
          return { success: false, error: error.message };
        }
      }

      const synced = await fetchCartItemsFromDb(user.id);
      return { success: true, data: synced };
    }

    await setGuestCart(items);
    return { success: true, data: items };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save cart";
    return { success: false, error: message };
  }
}

export async function mergeGuestCartOnLogin(): Promise<ActionResult<CartItem[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const guestItems = await getGuestCart();
    const existingItems = await fetchCartItemsFromDb(user.id);

    const merged = [...existingItems];

    for (const guestItem of guestItems) {
      const idx = merged.findIndex(
        (i) => i.productId === guestItem.productId && i.size === guestItem.size
      );
      if (idx >= 0) {
        merged[idx] = {
          ...merged[idx],
          quantity: merged[idx].quantity + guestItem.quantity,
        };
      } else {
        merged.push(guestItem);
      }
    }

    const cookieStore = await cookies();
    cookieStore.delete(GUEST_CART_COOKIE);

    return saveCart(merged);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to merge cart";
    return { success: false, error: message };
  }
}
