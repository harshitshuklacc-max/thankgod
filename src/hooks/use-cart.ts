"use client";

import { useCartContext } from "@/components/cart/cart-provider";

export function useCart() {
  return useCartContext();
}
