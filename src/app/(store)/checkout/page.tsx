"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Loader2, MapPin, Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { createCheckoutOrder, verifyRazorpayPayment } from "@/actions/checkout";
import { getCustomerAddresses } from "@/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";
import type { Address } from "@/types/database";

const GST_RATE = 0.18;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const taxAmount = Math.round(subtotal * GST_RATE);
  const grandTotal = subtotal + taxAmount;

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      setUser({ email: authUser.email ?? "", id: authUser.id });
      setForm((f) => ({
        ...f,
        email: authUser.email ?? "",
        name: authUser.user_metadata?.full_name ?? "",
        phone: authUser.user_metadata?.phone ?? "",
      }));

      const addrResult = await getCustomerAddresses();
      if (addrResult.success && addrResult.data) {
        setAddresses(addrResult.data);
        const defaultAddr = addrResult.data.find((a) => a.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadRazorpayScript = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    if (!items.length) {
      toast.error("Cart is empty");
      return;
    }

    if (!form.name || !form.email || !form.phone) {
      toast.error("Please fill in contact details");
      return;
    }

    setProcessing(true);

    const result = await createCheckoutOrder({
      items,
      addressId: selectedAddress || undefined,
      paymentMethod,
      customerName: form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
    });

    if (!result.success || !result.data) {
      setProcessing(false);
      toast.error(result.error || "Checkout failed");
      return;
    }

    if (paymentMethod === "cod") {
      await clearCart();
      setProcessing(false);
      toast.success("Order placed successfully!");
      router.push(`/account/orders/${result.data.orderId}`);
      return;
    }

    if (!result.data.razorpay) {
      setProcessing(false);
      toast.error("Payment initialization failed");
      return;
    }

    try {
      await loadRazorpayScript();
      const { razorpay } = result.data;

      const options = {
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: "SHOE MAFIA",
        description: "Order Payment",
        order_id: razorpay.razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyResult = await verifyRazorpayPayment({
            orderId: razorpay.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            items,
          });

          setProcessing(false);

          if (verifyResult.success) {
            await clearCart();
            toast.success("Payment successful!");
            router.push(`/account/orders/${razorpay.orderId}`);
          } else {
            toast.error(verifyResult.error || "Payment verification failed");
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#16A34A" },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      };

      const rzp = new window.Razorpay!(options);
      rzp.open();
    } catch {
      setProcessing(false);
      toast.error("Failed to open payment gateway");
    }
  };

  if (!items.length) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Button asChild className="mt-4">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-3xl font-black"
      >
        Checkout
      </motion.h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-primary" />
              Contact Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
          </section>

          {user && addresses.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-bold">Shipping Address</h2>
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => setSelectedAddress(addr.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-colors",
                      selectedAddress === addr.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <p className="font-semibold">{addr.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {addr.full_name}, {addr.address_line1}, {addr.city},{" "}
                      {addr.state} - {addr.pincode}
                    </p>
                  </button>
                ))}
              </div>
              <Button asChild variant="link" className="mt-2 px-0">
                <Link href="/account?tab=addresses">Manage addresses</Link>
              </Button>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Method
            </h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("razorpay")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  paymentMethod === "razorpay"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Pay Online (Razorpay)</p>
                  <p className="text-sm text-muted-foreground">
                    Cards, Net Banking & more
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  paymentMethod === "cod"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <Truck className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Pay when you receive
                  </p>
                </div>
              </button>
            </div>
          </section>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-fit rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
          <div className="mb-4 max-h-48 space-y-2 overflow-y-auto text-sm">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.size}`}
                className="flex justify-between"
              >
                <span className="truncate pr-2">
                  {item.name} x{item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={handlePlaceOrder}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : paymentMethod === "cod" ? (
              "Place Order (COD)"
            ) : (
              `Pay ${formatCurrency(grandTotal)}`
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
