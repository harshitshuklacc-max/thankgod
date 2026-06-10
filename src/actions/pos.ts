"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { decreaseStock } from "@/lib/inventory";
import { generateInvoiceNumber, generateOrderNumber } from "@/lib/utils";
import type { Invoice, Order } from "@/types/database";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface POSSaleItem {
  product_id: string;
  product_name: string;
  barcode?: string | null;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface CompletePOSSaleInput {
  items: POSSaleItem[];
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method?: string;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string | null;
}

export interface POSSaleResult {
  order: Order;
  invoice: Invoice;
}

export async function completePOSSale(
  input: CompletePOSSaleInput
): Promise<ActionResult<POSSaleResult>> {
  try {
    if (!input.items.length) {
      return { success: false, error: "No items in sale" };
    }

    const supabase = createAdminClient();
    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber();

    const subtotal = input.items.reduce((sum, item) => {
      return sum + item.unit_price * item.quantity - (item.discount ?? 0);
    }, 0);

    const taxAmount = input.tax_amount ?? 0;
    const discountAmount = input.discount_amount ?? 0;
    const grandTotal = subtotal + taxAmount - discountAmount;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: input.customer_name ?? "Walk-in Customer",
        customer_phone: input.customer_phone ?? null,
        status: "delivered",
        order_type: "offline",
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        shipping_amount: 0,
        grand_total: grandTotal,
        payment_method: input.payment_method ?? "cash",
        payment_status: "paid",
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (orderError || !order) {
      return { success: false, error: orderError?.message || "Failed to create order" };
    }

    const orderItems = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      barcode: item.barcode ?? null,
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

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        order_id: order.id,
        customer_name: input.customer_name ?? "Walk-in Customer",
        customer_phone: input.customer_phone ?? null,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        invoice_type: "pos",
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      await supabase.from("orders").delete().eq("id", order.id);
      return { success: false, error: invoiceError?.message || "Failed to create invoice" };
    }

    const invoiceItems = input.items.map((item) => ({
      invoice_id: invoice.id,
      product_id: item.product_id,
      product_name: item.product_name,
      barcode: item.barcode ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity - (item.discount ?? 0),
    }));

    const { error: invoiceItemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItems);

    if (invoiceItemsError) {
      await supabase.from("invoices").delete().eq("id", invoice.id);
      await supabase.from("orders").delete().eq("id", order.id);
      return { success: false, error: invoiceItemsError.message };
    }

    for (const item of input.items) {
      const stockResult = await decreaseStock(
        item.product_id,
        item.quantity,
        "pos_sale",
        "invoice",
        invoice.id
      );

      if (!stockResult.success) {
        return {
          success: false,
          error: `Insufficient stock for ${item.product_name}: ${stockResult.error}`,
        };
      }
    }

    return {
      success: true,
      data: {
        order: order as Order,
        invoice: invoice as Invoice,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete POS sale";
    return { success: false, error: message };
  }
}
