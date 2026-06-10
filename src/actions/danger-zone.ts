"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/admin";
import { timingSafeEqual } from "crypto";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function verifyPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, error: "Not authenticated" };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { ok: false, error: "Admin password not configured" };
  }

  const passwordMatch =
    password.length === adminPassword.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));

  if (!passwordMatch) {
    return { ok: false, error: "Invalid password" };
  }

  return { ok: true };
}

async function logAudit(
  action: string,
  entityType: string,
  details: Record<string, unknown> = {}
) {
  const supabase = createAdminClient();
  const session = await getAdminSession();

  await supabase.from("audit_logs").insert({
    action,
    entity_type: entityType,
    details,
    performed_by: session,
  });
}

export async function deleteAllProducts(password: string): Promise<ActionResult> {
  try {
    const auth = await verifyPassword(password);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();

    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { error } = await supabase
      .from("products")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit("delete_all_products", "products", { deleted_count: count ?? 0 });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete products";
    return { success: false, error: message };
  }
}

export async function deleteInventory(password: string): Promise<ActionResult> {
  try {
    const auth = await verifyPassword(password);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();

    const { count } = await supabase
      .from("inventory")
      .select("*", { count: "exact", head: true });

    const { error: inventoryError } = await supabase
      .from("inventory")
      .update({ quantity: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (inventoryError) {
      return { success: false, error: inventoryError.message };
    }

    await supabase
      .from("inventory_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await logAudit("delete_inventory", "inventory", { cleared_records: count ?? 0 });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete inventory";
    return { success: false, error: message };
  }
}

export async function deleteOrders(password: string): Promise<ActionResult> {
  try {
    const auth = await verifyPassword(password);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();

    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    await supabase
      .from("invoice_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("invoices")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("order_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase
      .from("orders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      return { success: false, error: error.message };
    }

    await logAudit("delete_orders", "orders", { deleted_count: count ?? 0 });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete orders";
    return { success: false, error: message };
  }
}

export async function factoryReset(password: string): Promise<ActionResult> {
  try {
    const auth = await verifyPassword(password);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const supabase = createAdminClient();

    await supabase
      .from("invoice_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("invoices")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("order_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("orders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("reviews")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("inventory_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("barcodes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("product_images")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("inventory")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase
      .from("products")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase
      .from("busy_imports")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await logAudit("factory_reset", "system", { timestamp: new Date().toISOString() });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Factory reset failed";
    return { success: false, error: message };
  }
}
