"use client";

import { motion } from "framer-motion";
import { MessageSquareQuote, Star } from "lucide-react";

import { formatDate } from "@/lib/utils";
import type { Review } from "@/types/database";

interface ReviewsSectionProps {
  reviews: Review[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  return (
    <section className="bg-muted/30 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mt-2 text-muted-foreground">
            Real reviews from verified shoppers
          </p>
        </motion.div>

        {reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background px-6 py-16 text-center"
          >
            <MessageSquareQuote className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No reviews yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground/80">
              Be the first to share your experience after shopping with us.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, index) => (
              <motion.article
                key={review.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                {review.title && (
                  <h3 className="mb-2 font-semibold text-foreground">
                    {review.title}
                  </h3>
                )}

                {review.comment && (
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {review.customer?.full_name ?? "Verified Customer"}
                    </p>
                    {review.is_verified_purchase && (
                      <span className="text-xs text-primary">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {formatDate(review.created_at)}
                  </time>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
