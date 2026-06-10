"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getProductById } from "@/actions/products";
import { getProductReviews } from "@/actions/reviews";
import { createReview } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useRealtimeInventory } from "@/hooks/use-realtime-inventory";
import { useWishlist } from "@/hooks/use-wishlist";
import {
  calculateDiscountedPrice,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import type { Product, Review } from "@/types/database";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addItem } = useCart();
  const { toggleItem, productIds } = useWishlist();
  const { getStock } = useRealtimeInventory(productId ? [productId] : undefined);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    const [productResult, reviewsResult] = await Promise.all([
      getProductById(productId),
      getProductReviews(productId),
    ]);

    if (productResult.success && productResult.data) {
      setProduct(productResult.data);
      if (productResult.data.sizes?.length) {
        setSelectedSize(productResult.data.sizes[0]);
      }
    }

    if (reviewsResult.success && reviewsResult.data) {
      setReviews(reviewsResult.data);
    }

    setLoading(false);
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg font-semibold">Product not found</p>
        <Button asChild className="mt-4">
          <Link href="/shop">Back to Shop</Link>
        </Button>
      </div>
    );
  }

  const images = product.images?.sort((a, b) => a.sort_order - b.sort_order) ?? [];
  const hasDiscount = product.discount_percent > 0;
  const finalPrice = hasDiscount
    ? calculateDiscountedPrice(product.selling_price, product.discount_percent)
    : product.selling_price;
  const stock = getStock(product.id) || product.inventory?.quantity || 0;
  const isWishlisted = productIds.includes(product.id);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const handleAddToCart = async () => {
    if (stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    if (product.sizes?.length && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    await addItem({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      quantity,
      size: selectedSize || undefined,
      image: images[0]?.image_url,
      barcode: product.barcode ?? undefined,
      sku: product.sku ?? undefined,
    });
    toast.success("Added to cart");
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    const result = await createReview({
      product_id: product.id,
      rating: reviewRating,
      comment: reviewComment || null,
    });
    setSubmittingReview(false);

    if (result.success) {
      toast.success("Review submitted for approval");
      setReviewComment("");
      loadProduct();
    } else {
      toast.error(result.error || "Failed to submit review");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
            {images[selectedImage]?.image_url ? (
              <Image
                src={images[selectedImage].image_url}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl font-black text-primary/20">SM</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2",
                    selectedImage === idx ? "border-primary" : "border-border"
                  )}
                >
                  <Image
                    src={img.image_url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {product.brand && (
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
          )}
          <h1 className="text-3xl font-black tracking-tight">{product.name}</h1>

          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.round(avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({reviews.length} reviews)
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {formatCurrency(product.selling_price)}
              </span>
            )}
          </div>

          <p
            className={cn(
              "text-sm font-medium",
              stock > 0 ? "text-green-600" : "text-destructive"
            )}
          >
            {stock > 0 ? `${stock} in stock` : "Out of stock"}
          </p>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div>
              <Label className="mb-2 block text-sm font-semibold">Size</Label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold">Quantity</Label>
            <div className="flex items-center gap-2 rounded-lg border border-border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                disabled={quantity >= stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={stock <= 0}
            >
              <ShoppingBag className="h-5 w-5" />
              Add to Cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => toggleItem(product.id)}
            >
              <Heart
                className={cn("h-5 w-5", isWishlisted && "fill-primary text-primary")}
              />
            </Button>
          </div>
        </motion.div>
      </div>

      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-bold">Customer Reviews</h2>

        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">Write a Review</h3>
          <div className="mb-4 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setReviewRating(i + 1)}
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    i < reviewRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your experience..."
            className="mb-4"
          />
          <Button onClick={handleSubmitReview} disabled={submittingReview}>
            Submit Review
          </Button>
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  {review.is_verified_purchase && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      Verified
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.created_at)}
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
          {!reviews.length && (
            <p className="text-center text-muted-foreground">
              No reviews yet. Be the first to review!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
