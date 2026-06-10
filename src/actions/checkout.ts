"use server";

import Razorpay from "razorpay";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { decreaseStock } from "@/lib/inventory";
import { generateInvoiceNumber, generateOrderNumber } from "@/lib/utils";
import type { CartItem } from "@/types/database";
import { createOrder } from "./orders";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface CheckoutInput {
  items: CartItem[];
  addressId?: string;
  shippingAddress?: Record<string, unknown>;
  paymentMethod: "razorpay" | "cod";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
}

export interface RazorpayOrderData {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

const SHIPPING_FEE = 0;
const GST_RATE = 0.18;

function calculateTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = Math.round(subtotal * GST_RATE);
  const grandTotal = subtotal + taxAmount + SHIPPING_FEE;
  return { subtotal, taxAmount, grandTotal };
}

export async function createCheckoutOrder(
  input: CheckoutInput
): Promise<ActionResult<{ orderId: string; razorpay?: RazorpayOrderData }>> {
  try {
    if (!input.items.length) {
      return { success: false, error: "Cart is empty" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { subtotal, taxAmount, grandTotal } = calculateTotals(input.items);

    let shippingAddress = input.shippingAddress ?? null;

    if (input.addressId && user) {
      const { data: address } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", input.addressId)
        .eq("customer_id", user.id)
        .single();

      if (address) {
        shippingAddress = address as Record<string, unknown>;
      }
    }

    const orderResult = await createOrder({
      customer_id: user?.id ?? null,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      order_type: "online",
      items: input.items.map((item) => ({
        product_id: item.productId,
        product_name: item.name,
        barcode: item.barcode,
        sku: item.sku,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.price,
      })),
      tax_amount: taxAmount,
      shipping_amount: SHIPPING_FEE,
      payment_method: input.paymentMethod,
      payment_status: input.paymentMethod === "cod" ? "cod" : "pending",
      shipping_address: shippingAddress,
      notes: input.notes,
    });

    if (!orderResult.success || !orderResult.data) {
      return { success: false, error: orderResult.error || "Failed to create order" };
    }

    const order = orderResult.data;

    if (input.paymentMethod === "cod") {
      const adminSupabase = createAdminClient();
      await adminSupabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", order.id);

      for (const item of input.items) {
        await decreaseStock(item.productId, item.quantity, "sale", "order", order.id);
      }

      const invoiceNumber = generateInvoiceNumber();
      await adminSupabase.from("invoices").insert({
        invoice_number: invoiceNumber,
        order_id: order.id,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        grand_total: grandTotal,
        invoice_type: "sale",
      });

      return { success: true, data: { orderId: order.id } };
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return { success: false, error: "Payment gateway not configured" };
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const razorpayOrder = await razorpay.orders.create({
      amount: grandTotal * 100,
      currency: "INR",
      receipt: order.order_number,
      notes: { order_id: order.id },
    });

    const adminSupabase = createAdminClient();
    await adminSupabase.from("payments").insert({
      order_id: order.id,
      razorpay_order_id: razorpayOrder.id,
      amount: grandTotal,
      currency: "INR",
      status: "created",
    });

    return {
      success: true,
      data: {
        orderId: order.id,
        razorpay: {
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: grandTotal * 100,
          currency: "INR",
          keyId,
        },
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return { success: false, error: message };
  }
}

export async function verifyRazorpayPayment(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  items: CartItem[];
}): Promise<ActionResult<{ orderId: string }>> {
  try {
    const crypto = await import("crypto");
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return { success: false, error: "Payment gateway not configured" };
    }

    const body = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== input.razorpaySignature) {
      return { success: false, error: "Invalid payment signature" };
    }

    const adminSupabase = createAdminClient();

    await adminSupabase
      .from("payments")
      .update({
        razorpay_payment_id: input.razorpayPaymentId,
        razorpay_signature: input.razorpaySignature,
        status: "paid",
      })
      .eq("order_id", input.orderId);

    await adminSupabase
      .from("orders")
      .update({ status: "confirmed", payment_status: "paid" })
      .eq("id", input.orderId);

    for (const item of input.items) {
      await decreaseStock(item.productId, item.quantity, "sale", "order", input.orderId);
    }

    const { data: order } = await adminSupabase
      .from("orders")
      .select("*")
      .eq("id", input.orderId)
      .single();

    if (order) {
      const invoiceNumber = generateInvoiceNumber();
      await adminSupabase.from("invoices").insert({
        invoice_number: invoiceNumber,
        order_id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        discount_amount: order.discount_amount,
        grand_total: order.grand_total,
        invoice_type: "sale",
      });
    }

    return { success: true, data: { orderId: input.orderId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment verification failed";
    return { success: false, error: message };
  }
}
