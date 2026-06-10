"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PackageOpen } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@/types/database";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref: string;
}

export function ProductSection({
  title,
  subtitle,
  products,
  viewAllHref,
}: ProductSectionProps) {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {products.length > 0 && (
            <Link
              href={viewAllHref}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              View All
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </motion.div>

        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center"
          >
            <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No products available yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground/80">
              Check back soon for new arrivals in this collection.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
