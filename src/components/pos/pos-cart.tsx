"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { calculateDiscountedPrice, cn, formatCurrency } from "@/lib/utils";
import type { POSCartItem, Product } from "@/types/database";

interface POSCartProps {
  items: POSCartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateDiscount: (productId: string, discount: number) => void;
  onRemove: (productId: string) => void;
  getStock: (productId: string) => number;
  className?: string;
}

function getItemPrice(product: Product) {
  return product.discount_percent > 0
    ? calculateDiscountedPrice(product.selling_price, product.discount_percent)
    : product.selling_price;
}

export function POSCart({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemove,
  getStock,
  className,
}: POSCartProps) {
  const subtotal = items.reduce((sum, item) => {
    const price = getItemPrice(item.product);
    return sum + price * item.quantity - item.discount;
  }, 0);

  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-lg font-bold">Cart ({items.length})</h2>
      </div>

      <ScrollArea className="flex-1 px-4">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center text-sm text-muted-foreground"
            >
              Scan or search products to add to cart
            </motion.p>
          ) : (
            <div className="space-y-3 py-4">
              {items.map((item) => {
                const price = getItemPrice(item.product);
                const stock = getStock(item.product.id);
                const lineTotal = price * item.quantity - item.discount;

                return (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-xl border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.product.sku} · {formatCurrency(price)}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-xs font-medium",
                            stock <= 5 ? "text-destructive" : "text-green-600"
                          )}
                        >
                          Stock: {stock}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive"
                        onClick={() => onRemove(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-lg border border-border bg-background">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
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
                            onUpdateQuantity(item.product.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold text-primary">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Discount ₹</span>
                      <Input
                        type="number"
                        min={0}
                        value={item.discount || ""}
                        onChange={(e) =>
                          onUpdateDiscount(
                            item.product.id,
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {items.length > 0 && (
        <div className="border-t border-border bg-card p-4">
          {totalDiscount > 0 && (
            <div className="mb-1 flex justify-between text-sm text-muted-foreground">
              <span>Item discounts</span>
              <span>-{formatCurrency(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Subtotal</span>
            <span className="text-primary">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
