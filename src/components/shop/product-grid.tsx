"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import {
  calculateDiscountedPrice,
  cn,
  formatCurrency,
} from "@/lib/utils";
import type { Product } from "@/types/database";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border">
          <div className="skeleton aspect-square w-full" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ShopProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCart();
  const { toggleItem, productIds } = useWishlist();
  const [imageError, setImageError] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.is_primary) ?? product.images?.[0];
  const hasDiscount = product.discount_percent > 0;
  const finalPrice = hasDiscount
    ? calculateDiscountedPrice(product.selling_price, product.discount_percent)
    : product.selling_price;
  const inStock = (product.inventory?.quantity ?? 0) > 0;
  const isWishlisted = productIds.includes(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) {
      toast.error("Out of stock");
      return;
    }
    await addItem({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      image: primaryImage?.image_url,
      barcode: product.barcode ?? undefined,
      sku: product.sku ?? undefined,
    });
    toast.success("Added to cart");
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleItem(product.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group"
    >
      <Link
        href={`/shop/${product.id}`}
        className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage?.image_url && !imageError ? (
            <Image
              src={primaryImage.image_url}
              alt={primaryImage.alt_text ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-3xl font-black text-primary/20">SM</span>
            </div>
          )}

          {hasDiscount && (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
              -{Math.round(product.discount_percent)}%
            </span>
          )}

          {!inStock && (
            <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/70 py-1 text-center text-xs font-medium text-white">
              Out of Stock
            </span>
          )}

          <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={handleWishlist}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow",
                isWishlisted && "bg-primary text-primary-foreground"
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", isWishlisted && "fill-current")} />
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow disabled:opacity-50"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3">
          {product.brand && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
          )}
          <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-bold text-primary">{formatCurrency(finalPrice)}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.selling_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function ProductGrid({
  products,
  loading,
  skeletonCount = 8,
}: ProductGridProps) {
  if (loading) {
    return <GridSkeleton count={skeletonCount} />;
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-semibold">No products found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ShopProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
