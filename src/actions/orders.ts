"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { decreaseStock } from "@/lib/inventory";
import { generateOrderNumber } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/types/database";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface CreateOrderItemInput {
  product_id?: string | null;
  product_name: string;
  barcode?: string | null;
  sku?: string | null;
  size?: string | null;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface CreateOrderInput {
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  order_type?: "online" | "offline";
  items: CreateOrderItemInput[];
  tax_amount?: number;
  discount_amount?: number;
  shipping_amount?: number;
  payment_method?: string | null;
  payment_status?: string;
  shipping_address?: Record<string, unknown> | null;
  notes?: string | null;
}

export interface OrderFilters {
  status?: OrderStatus;
  order_type?: "online" | "offline";
  customer_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function calculateOrderTotals(
  items: CreateOrderItemInput[],
  taxAmount = 0,
  discountAmount = 0,
  shippingAmount = 0
) {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.unit_price * item.quantity - (item.discount ?? 0);
    return sum + itemTotal;
  }, 0);

  const grandTotal = subtotal + taxAmount + shippingAmount - discountAmount;

  return { subtotal, grandTotal };
}

export async function createOrder(input: CreateOrderInput): Promise<ActionResult<Order>> {
  try {
    const supabase = createAdminClient();
    const orderNumber = generateOrderNumber();
    const { subtotal, grandTotal } = calculateOrderTotals(
      input.items,
      input.tax_amount,
      input.discount_amount,
      input.shipping_amount
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: input.customer_id ?? null,
        customer_name: input.customer_name ?? null,
        customer_email: input.customer_email ?? null,
        customer_phone: input.customer_phone ?? null,
        status: "pending",
        order_type: input.order_type ?? "online",
        subtotal,
        tax_amount: input.tax_amount ?? 0,
        discount_amount: input.discount_amount ?? 0,
        shipping_amount: input.shipping_amount ?? 0,
        grand_total: grandTotal,
        payment_method: input.payment_method ?? null,
        payment_status: input.payment_status ?? "pending",
        shipping_address: input.shipping_address ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (orderError || !order) {
      return { success: false, error: orderError?.message || "Failed to create order" };
    }

    const orderItems = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      barcode: item.barcode ?? null,
      sku: item.sku ?? null,
      size: item.size ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount ?? 0,
      total_price: item.unit_price * item.quantity - (item.discount ?? 0),
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return { success: false, error: itemsError.message };
    }

    return { success: true, data: order as Order };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    return { success: false, error: message };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult<Order>> {
  try {
    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: fetchError?.message || "Order not found" };
    }

    const previousStatus = existing.status as OrderStatus;

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (error || !order) {
      return { success: false, error: error?.message || "Failed to update order status" };
    }

    if (
      status === "delivered" &&
      previousStatus !== "delivered" &&
      previousStatus !== "cancelled"
    ) {
      const items = (existing.order_items || []) as OrderItem[];

      for (const item of items) {
        if (!item.product_id) continue;

        const stockResult = await decreaseStock(
          item.product_id,
          item.quantity,
          "sale",
          "order",
          orderId
        );

        if (!stockResult.success) {
          return {
            success: false,
            error: `Failed to decrease stock for ${item.product_name}: ${stockResult.error}`,
          };
        }
      }

      await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", orderId);
    }

    return { success: true, data: order as Order };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update order status";
    return { success: false, error: message };
  }
}

export async function getOrders(filters?: OrderFilters): Promise<ActionResult<Order[]>> {
  try {
    const supabase = createAdminClient();

    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.order_type) {
      query = query.eq("order_type", filters.order_type);
    }

    if (filters?.customer_id) {
      query = query.eq("customer_id", filters.customer_id);
    }

    if (filters?.search) {
      query = query.or(
        `order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Order[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    return { success: false, error: message };
  }
}

export async function getOrderById(id: string): Promise<ActionResult<Order>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Order not found" };
    }

    return { success: true, data: data as Order };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch order";
    return { success: false, error: message };
  }
}

export async function cancelOrder(orderId: string): Promise<ActionResult<Order>> {
  try {
    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: fetchError?.message || "Order not found" };
    }

    if (existing.status === "delivered") {
      return { success: false, error: "Cannot cancel a delivered order" };
    }

    if (existing.status === "cancelled") {
      return { success: false, error: "Order is already cancelled" };
    }

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: "refunded",
      })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (error || !order) {
      return { success: false, error: error?.message || "Failed to cancel order" };
    }

    return { success: true, data: order as Order };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel order";
    return { success: false, error: message };
  }
}
