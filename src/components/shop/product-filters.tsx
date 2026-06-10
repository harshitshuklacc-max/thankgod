"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface ShopFilters {
  brands: string[];
  category: string;
  gender: string;
  sizes: string[];
  colors: string[];
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
}

export const DEFAULT_FILTERS: ShopFilters = {
  brands: [],
  category: "",
  gender: "",
  sizes: [],
  colors: [],
  minPrice: "",
  maxPrice: "",
  inStockOnly: false,
};

interface ProductFiltersProps {
  filters: ShopFilters;
  onChange: (filters: ShopFilters) => void;
  brands: string[];
  categories: { id: string; name: string; slug: string }[];
  sizes: string[];
  colors: string[];
  className?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ProductFilters({
  filters,
  onChange,
  brands,
  categories,
  sizes,
  colors,
  className,
  mobileOpen,
  onMobileClose,
}: ProductFiltersProps) {
  const update = (partial: Partial<ShopFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleArray = (key: "brands" | "sizes" | "colors", value: string) => {
    const arr = filters[key];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    update({ [key]: next });
  };

  const clearAll = () => onChange(DEFAULT_FILTERS);

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span className="font-semibold">Filters</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
          Clear all
        </Button>
      </div>

      <FilterSection title="Category">
        <Select
          value={filters.category || "all"}
          onValueChange={(v) => update({ category: v === "all" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection title="Gender">
        <Select
          value={filters.gender || "all"}
          onValueChange={(v) => update({ gender: v === "all" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="men">Men</SelectItem>
            <SelectItem value="women">Women</SelectItem>
            <SelectItem value="unisex">Unisex</SelectItem>
            <SelectItem value="kids">Kids</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      {brands.length > 0 && (
        <FilterSection title="Brand">
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand} className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => toggleArray("brands", brand)}
                />
                <span className="text-sm">{brand}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {sizes.length > 0 && (
        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleArray("sizes", size)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  filters.sizes.includes(size)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {colors.length > 0 && (
        <FilterSection title="Color">
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleArray("colors", color)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                  filters.colors.includes(color)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Price Range">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => update({ minPrice: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
          />
        </div>
      </FilterSection>

      <Separator />

      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={filters.inStockOnly}
          onCheckedChange={(checked) =>
            update({ inStockOnly: checked === true })
          }
        />
        <span className="text-sm font-medium">In stock only</span>
      </label>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden w-64 shrink-0 rounded-2xl border border-border bg-card p-5 lg:block",
          className
        )}
      >
        {content}
      </aside>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        >
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="h-full w-80 overflow-y-auto bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-end">
              <Button type="button" variant="ghost" size="icon" onClick={onMobileClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {content}
          </motion.aside>
        </motion.div>
      )}
    </>
  );
}
