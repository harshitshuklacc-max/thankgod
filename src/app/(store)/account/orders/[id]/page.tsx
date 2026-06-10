"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Package,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getOrderById } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/database";

const STATUS_STEPS: { status: OrderStatus; label: string; icon: typeof Package }[] = [
  { status: "pending", label: "Order Placed", icon: Package },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "packed", label: "Packed", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function getStatusIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return STATUS_STEPS.findIndex((s) => s.status === status);
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const result = await getOrderById(orderId);
    if (result.success && result.data) {
      setOrder(result.data);
    }
    setLoading(false);
  }, [orderId, router]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg font-semibold">Order not found</p>
        <Button asChild className="mt-4">
          <Link href="/account?tab=orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const currentIndex = getStatusIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-6" asChild>
        <Link href="/account?tab=orders">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black">Order {order.order_number}</h1>
        <p className="text-muted-foreground">
          Placed on {formatDateTime(order.created_at)}
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-bold">Order Status</h2>

            {isCancelled ? (
              <div className="rounded-xl bg-destructive/10 p-4 text-center text-destructive">
                This order has been cancelled
              </div>
            ) : (
              <div className="relative">
                {STATUS_STEPS.map((step, index) => {
                  const isComplete = index <= currentIndex;
                  const isCurrent = index === currentIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex gap-4 pb-8 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border-2",
                            isComplete
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {index < STATUS_STEPS.length - 1 && (
                          <div
                            className={cn(
                              "mt-2 w-0.5 flex-1 min-h-[40px]",
                              index < currentIndex ? "bg-primary" : "bg-border"
                            )}
                          />
                        )}
                      </div>
                      <div className="pt-2">
                        <p
                          className={cn(
                            "font-semibold",
                            isCurrent && "text-primary"
                          )}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-muted-foreground">
                            Current status
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Order Items</h2>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    {item.size && (
                      <p className="text-sm text-muted-foreground">
                        Size: {item.size}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.total_price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatCurrency(order.shipping_amount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">
                {formatCurrency(order.grand_total)}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Payment: </span>
              <span className="capitalize">{order.payment_method}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Status: </span>
              <span className="capitalize">{order.payment_status}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
