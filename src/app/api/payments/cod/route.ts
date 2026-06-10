import { NextResponse } from "next/server";

import { sendAdminNewOrderEmail, sendOrderConfirmedEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/types/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body as { orderId?: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existing.status === "cancelled") {
      return NextResponse.json({ error: "Cannot confirm a cancelled order" }, { status: 400 });
    }

    if (existing.payment_status === "paid") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "cod",
        payment_method: "cod",
        status: "confirmed",
      })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .single();

    if (updateError || !order) {
      return NextResponse.json(
        { error: "Failed to confirm COD order", details: updateError?.message },
        { status: 500 }
      );
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: orderId,
      amount: order.grand_total,
      currency: "INR",
      method: "cod",
      status: "pending",
    });

    if (paymentError) {
      console.error("Failed to create COD payment record:", paymentError.message);
    }

    const orderWithItems = order as Order;

    await Promise.allSettled([
      sendOrderConfirmedEmail(orderWithItems),
      sendAdminNewOrderEmail(orderWithItems),
    ]);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_status: order.payment_status,
        status: order.status,
      },
    });
  } catch (err) {
    console.error("COD confirmation error:", err);
    const message = err instanceof Error ? err.message : "Failed to confirm COD order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
