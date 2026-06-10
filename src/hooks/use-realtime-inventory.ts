"use client";

import { useCallback, useEffect, useState } from "react";

import type { Inventory } from "@/types/database";

export function useRealtimeInventory(productIds?: string[]) {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    const params = new URLSearchParams();
    if (productIds?.length) {
      params.set("productIds", productIds.join(","));
    }

    const res = await fetch(`/api/inventory?${params.toString()}`);
    const json = await res.json();

    if (res.ok && json.data) {
      const map: Record<string, number> = {};
      for (const row of json.data as Pick<Inventory, "product_id" | "quantity">[]) {
        map[row.product_id] = row.quantity;
      }
      setInventory(map);
    }
    setLoading(false);
  }, [productIds]);

  useEffect(() => {
    fetchInventory();
    const interval = setInterval(fetchInventory, 30000);
    return () => clearInterval(interval);
  }, [fetchInventory]);

  const getStock = useCallback(
    (productId: string) => inventory[productId] ?? 0,
    [inventory]
  );

  return { inventory, loading, getStock, refetch: fetchInventory };
}
