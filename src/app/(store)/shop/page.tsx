"use client";

import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getCategories, getProducts } from "@/actions/products";
import {
  DEFAULT_FILTERS,
  ProductFilters,
  type ShopFilters,
} from "@/components/shop/product-filters";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateDiscountedPrice } from "@/lib/utils";
import type { Product } from "@/types/database";

type SortOption = "newest" | "price-asc" | "price-desc" | "popular";

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<SortOption>("newest");
  const [filters, setFilters] = useState<ShopFilters>({
    ...DEFAULT_FILTERS,
    category: searchParams.get("category") || "",
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);

  useEffect(() => {
    getCategories().then((result) => {
      if (result.success && result.data) {
        setCategories(result.data);
      }
    });
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const result = await getProducts({ is_active: true, limit: 200 });
    if (result.success && result.data) {
      setProducts(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filterOptions = useMemo(() => {
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))] as string[];
    const sizes = [
      ...new Set(products.flatMap((p) => p.sizes || [])),
    ].sort();
    const colors = [
      ...new Set(products.map((p) => p.color).filter(Boolean)),
    ] as string[];
    return { brands, sizes, colors };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    if (filters.category) {
      result = result.filter((p) => p.category?.slug === filters.category);
    }

    if (filters.gender) {
      result = result.filter((p) => p.gender === filters.gender);
    }

    if (filters.brands.length) {
      result = result.filter((p) => p.brand && filters.brands.includes(p.brand));
    }

    if (filters.sizes.length) {
      result = result.filter((p) =>
        filters.sizes.some((s) => p.sizes?.includes(s))
      );
    }

    if (filters.colors.length) {
      result = result.filter(
        (p) => p.color && filters.colors.includes(p.color)
      );
    }

    if (filters.minPrice) {
      const min = Number(filters.minPrice);
      result = result.filter((p) => {
        const price =
          p.discount_percent > 0
            ? calculateDiscountedPrice(p.selling_price, p.discount_percent)
            : p.selling_price;
        return price >= min;
      });
    }

    if (filters.maxPrice) {
      const max = Number(filters.maxPrice);
      result = result.filter((p) => {
        const price =
          p.discount_percent > 0
            ? calculateDiscountedPrice(p.selling_price, p.discount_percent)
            : p.selling_price;
        return price <= max;
      });
    }

    if (filters.inStockOnly) {
      result = result.filter((p) => (p.inventory?.quantity ?? 0) > 0);
    }

    switch (sort) {
      case "price-asc":
        result.sort((a, b) => {
          const pa =
            a.discount_percent > 0
              ? calculateDiscountedPrice(a.selling_price, a.discount_percent)
              : a.selling_price;
          const pb =
            b.discount_percent > 0
              ? calculateDiscountedPrice(b.selling_price, b.discount_percent)
              : b.selling_price;
          return pa - pb;
        });
        break;
      case "price-desc":
        result.sort((a, b) => {
          const pa =
            a.discount_percent > 0
              ? calculateDiscountedPrice(a.selling_price, a.discount_percent)
              : a.selling_price;
          const pb =
            b.discount_percent > 0
              ? calculateDiscountedPrice(b.selling_price, b.discount_percent)
              : b.selling_price;
          return pb - pa;
        });
        break;
      case "popular":
        result.sort((a, b) => b.total_sold - a.total_sold);
        break;
      default:
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return result;
  }, [products, search, filters, sort]);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">
          Shop <span className="text-primary">Collection</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Discover premium footwear at SHOE MAFIA
        </p>
      </motion.div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>

          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-8">
        <ProductFilters
          filters={filters}
          onChange={setFilters}
          brands={filterOptions.brands}
          categories={categories}
          sizes={filterOptions.sizes}
          colors={filterOptions.colors}
          mobileOpen={mobileFiltersOpen}
          onMobileClose={() => setMobileFiltersOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filteredProducts.length} products`}
          </p>
          <ProductGrid products={filteredProducts} loading={loading} />
        </div>
      </div>
    </div>
  );
}
