"use client";

import { motion } from "framer-motion";
import {
  Barcode,
  CreditCard,
  Loader2,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { completePOSSale } from "@/actions/pos";
import { getProductByBarcode, getProducts } from "@/actions/products";
import { BarcodeScanner } from "@/components/pos/barcode-scanner";
import { InvoicePreview } from "@/components/pos/invoice-preview";
import { POSCart } from "@/components/pos/pos-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRealtimeInventory } from "@/hooks/use-realtime-inventory";
import {
  calculateDiscountedPrice,
  cn,
  formatCurrency,
} from "@/lib/utils";
import type { Invoice, POSCartItem, Product } from "@/types/database";

const GST_RATE = 0.18;

function getItemPrice(product: Product) {
  return product.discount_percent > 0
    ? calculateDiscountedPrice(product.selling_price, product.discount_percent)
    : product.selling_price;
}

export default function POSPage() {
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showCamera, setShowCamera] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<{
    invoice: Invoice;
    items: POSCartItem[];
    taxAmount: number;
    discountAmount: number;
  } | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const productIds = cart.map((i) => i.product.id);
  const { getStock } = useRealtimeInventory(productIds);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const addToCart = useCallback((product: Product) => {
    const stock = product.inventory?.quantity ?? 0;
    if (stock <= 0) {
      toast.error("Out of stock");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= stock) {
          toast.error("Insufficient stock");
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
    toast.success(`Added ${product.name}`);
    setBarcodeInput("");
    barcodeRef.current?.focus();
  }, []);

  const handleBarcodeScan = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      const result = await getProductByBarcode(trimmed);
      if (result.success && result.data) {
        addToCart(result.data);
      } else {
        toast.error("Product not found");
      }
    },
    [addToCart]
  );

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBarcodeScan(barcodeInput);
    }
  };

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const result = await getProducts({ search: q, is_active: true, limit: 12 });
    if (result.success && result.data) {
      setSearchResults(result.data);
    }
    setSearching(false);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [handleSearch]);

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    const stock = getStock(productId);
    if (quantity > stock) {
      toast.error("Insufficient stock");
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, discount } : i))
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = getItemPrice(item.product);
    return sum + price * item.quantity - item.discount;
  }, 0);

  const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
  const taxAmount = Math.round(subtotal * GST_RATE);
  const grandTotal = subtotal + taxAmount;

  const handleCompleteSale = async () => {
    if (!cart.length) {
      toast.error("Cart is empty");
      return;
    }

    setCompleting(true);

    const result = await completePOSSale({
      items: cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unit_price: getItemPrice(item.product),
        discount: item.discount,
      })),
      customer_name: customerName || "Walk-in Customer",
      customer_phone: customerPhone || null,
      payment_method: paymentMethod,
      tax_amount: taxAmount,
      discount_amount: itemDiscounts,
    });

    setCompleting(false);

    if (result.success && result.data) {
      toast.success("Sale completed!");
      setCompletedInvoice({
        invoice: result.data.invoice,
        items: [...cart],
        taxAmount,
        discountAmount: itemDiscounts,
      });
    } else {
      toast.error(result.error || "Failed to complete sale");
    }
  };

  const resetSale = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCompletedInvoice(null);
    barcodeRef.current?.focus();
  };

  if (completedInvoice) {
    const { invoice, items, taxAmount: tax, discountAmount } = completedInvoice;
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <InvoicePreview
          invoiceNumber={invoice.invoice_number}
          date={invoice.created_at}
          customerName={invoice.customer_name || "Walk-in Customer"}
          customerPhone={invoice.customer_phone}
          items={items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: getItemPrice(item.product),
            totalPrice:
              getItemPrice(item.product) * item.quantity - item.discount,
          }))}
          subtotal={invoice.subtotal}
          taxAmount={tax}
          discountAmount={discountAmount}
          grandTotal={invoice.grand_total}
          onClose={resetSale}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-primary">SHOE</span> MAFIA POS
            </h1>
            <p className="text-sm text-muted-foreground">Point of Sale System</p>
          </motion.div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="h-4 w-4" />
            {cart.length} items · {formatCurrency(grandTotal)}
          </div>
        </div>
      </header>

      <div className="grid h-[calc(100vh-80px)] lg:grid-cols-5">
        <div className="space-y-4 overflow-y-auto border-r border-border p-4 lg:col-span-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Barcode className="h-4 w-4 text-primary" />
              Barcode Scanner
            </Label>
            <Input
              ref={barcodeRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan barcode or type and press Enter..."
              className="font-mono text-lg"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowCamera((p) => !p)}
            >
              {showCamera ? "Hide Camera" : "Open Camera Scanner"}
            </Button>
          </div>

          {showCamera && (
            <BarcodeScanner
              onScan={handleBarcodeScan}
              onClose={() => setShowCamera(false)}
            />
          )}

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Search className="h-4 w-4 text-primary" />
              Product Search
            </Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
            />

            {searching && (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {searchResults.map((product) => {
                  const stock = product.inventory?.quantity ?? 0;
                  const price = getItemPrice(product);

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={stock <= 0}
                      className={cn(
                        "rounded-lg border border-border p-3 text-left transition-all hover:border-primary hover:shadow-md",
                        stock <= 0 && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <p className="truncate font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku} · Stock: {stock}
                      </p>
                      <p className="mt-1 font-bold text-primary">
                        {formatCurrency(price)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <Label className="mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Name
              </Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer"
              />
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <Label className="mb-2">Phone (optional)</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-card lg:col-span-2">
          <POSCart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onUpdateDiscount={updateDiscount}
            onRemove={removeItem}
            getStock={getStock}
            className="flex-1"
          />

          <div className="border-t border-border p-4 space-y-3">
            <div className="space-y-1 text-sm">
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

            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full text-base font-bold"
              onClick={handleCompleteSale}
              disabled={completing || !cart.length}
            >
              {completing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Complete Sale · ${formatCurrency(grandTotal)}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
