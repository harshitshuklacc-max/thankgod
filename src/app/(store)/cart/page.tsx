"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";

const GST_RATE = 0.18;

export default function CartPage() {
  const { items, loading, itemCount, subtotal, updateQuantity, removeItem, clearCart } =
    useCart();

  const taxAmount = Math.round(subtotal * GST_RATE);
  const grandTotal = subtotal + taxAmount;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Add some shoes to get started
          </p>
          <Button asChild className="mt-6">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </motion.div>
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
        Shopping Cart ({itemCount})
      </motion.h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item, index) => (
            <motion.div
              key={`${item.productId}-${item.size}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-primary/30">
                    SM
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/shop/${item.productId}`}
                  className="font-semibold hover:text-primary"
                >
                  {item.name}
                </Link>
                {item.size && (
                  <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                )}
                <p className="mt-1 font-bold text-primary">
                  {formatCurrency(item.price)}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg border border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1, item.size)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1, item.size)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeItem(item.productId, item.size)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <Button type="button" variant="outline" onClick={clearCart}>
            Clear Cart
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-fit rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>

          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
