"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  calculateDiscountedPrice,
  cn,
  formatCurrency,
} from "@/lib/utils";
import type { Product } from "@/types/database";

interface ProductCardProps {
  product?: Product;
  loading?: boolean;
  index?: number;
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="skeleton aspect-square w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-6 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function ProductCard({ product, loading, index = 0 }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (loading || !product) {
    return <ProductCardSkeleton />;
  }

  const primaryImage =
    product.images?.find((img) => img.is_primary) ?? product.images?.[0];
  const imageUrl = primaryImage?.image_url;
  const hasDiscount = product.discount_percent > 0;
  const finalPrice = hasDiscount
    ? calculateDiscountedPrice(product.selling_price, product.discount_percent)
    : product.selling_price;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((prev) => !prev);
    toast.success(
      wishlisted ? "Removed from wishlist" : "Added to wishlist"
    );
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <Link
        href={`/products/${product.id}`}
        className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={primaryImage?.alt_text ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-4xl font-black text-primary/20">SM</span>
            </div>
          )}

          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-lg">
              -{Math.round(product.discount_percent)}%
            </span>
          )}

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(
              "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110",
              wishlisted && "bg-primary text-primary-foreground"
            )}
          >
            <Heart
              className={cn("h-4 w-4", wishlisted && "fill-current")}
            />
          </button>

          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
            <span className="text-sm font-medium text-white">View Details</span>
          </div>
        </div>

        <div className="space-y-2 p-4">
          {product.brand && (
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
          )}
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.selling_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
