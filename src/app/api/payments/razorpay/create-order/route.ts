import { NextResponse } from "next/server";

import { getRazorpayClient, getRazorpayKeyId } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json({ error: "Cannot pay for a cancelled order" }, { status: 400 });
    }

    const amountInPaise = Math.round(Number(order.grand_total) * 100);

    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: "Order amount must be at least ₹1" },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        order_number: order.order_number,
      },
    });

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      razorpay_order_id: razorpayOrder.id,
      amount: order.grand_total,
      currency: "INR",
      status: "created",
    });

    if (paymentError) {
      return NextResponse.json(
        { error: "Failed to record payment", details: paymentError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("orders")
      .update({ payment_method: "razorpay" })
      .eq("id", order.id);

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: getRazorpayKeyId(),
      orderNumber: order.order_number,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
      },
    });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    const message = err instanceof Error ? err.message : "Failed to create payment order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
