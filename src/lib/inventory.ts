import { createAdminClient } from "@/lib/supabase/admin";

export async function decreaseStock(
  productId: string,
  quantity: number,
  changeType: "sale" | "pos_sale" = "sale",
  referenceType?: string,
  referenceId?: string,
  createdBy?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("decrease_inventory", {
    p_product_id: productId,
    p_quantity: quantity,
    p_change_type: changeType,
    p_reference_type: referenceType || null,
    p_reference_id: referenceId || null,
    p_created_by: createdBy || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Insufficient stock" };
  }

  return { success: true };
}

export async function increaseStock(
  productId: string,
  quantity: number,
  changeType: "purchase" | "import" | "adjustment" | "return" = "purchase",
  referenceType?: string,
  referenceId?: string,
  createdBy?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("increase_inventory", {
    p_product_id: productId,
    p_quantity: quantity,
    p_change_type: changeType,
    p_reference_type: referenceType || null,
    p_reference_id: referenceId || null,
    p_created_by: createdBy || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: !!data };
}

export async function getLowStockProducts(threshold?: number) {
  const supabase = createAdminClient();

  let query = supabase
    .from("inventory")
    .select("*, product:products(id, name, sku, barcode)")
    .order("quantity", { ascending: true });

  if (threshold !== undefined) {
    query = query.lte("quantity", threshold);
  } else {
    query = query.filter("quantity", "lte", "low_stock_threshold");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
