import { createHmac } from "crypto";
import { NextResponse } from "next/server";

import { sendAdminNewOrderEmail, sendOrderConfirmedEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/types/database";

interface VerifyPaymentBody {
  orderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyPaymentBody;
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Payment verification is not configured" },
        { status: 500 }
      );
    }

    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "captured",
        method: "razorpay",
      })
      .eq("order_id", orderId)
      .eq("razorpay_order_id", razorpay_order_id);

    if (paymentUpdateError) {
      return NextResponse.json(
        { error: "Failed to update payment record", details: paymentUpdateError.message },
        { status: 500 }
      );
    }

    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        payment_method: "razorpay",
        status: "confirmed",
      })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (orderUpdateError || !updatedOrder) {
      return NextResponse.json(
        { error: "Failed to update order", details: orderUpdateError?.message },
        { status: 500 }
      );
    }

    const orderWithItems = updatedOrder as Order;

    await Promise.allSettled([
      sendOrderConfirmedEmail(orderWithItems),
      sendAdminNewOrderEmail(orderWithItems),
    ]);

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        order_number: updatedOrder.order_number,
        payment_status: updatedOrder.payment_status,
        status: updatedOrder.status,
      },
    });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    const message = err instanceof Error ? err.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
