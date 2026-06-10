"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createProduct, updateProduct } from "@/actions/products";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { generateBarcode, generateSKU } from "@/lib/utils";
import type { Category, Product } from "@/types/database";

const GENDERS = ["men", "women", "unisex", "kids"] as const;
const SIZES = ["5", "6", "7", "8", "9", "10", "11", "12"];

interface ProductFormProps {
  categories: Category[];
  product?: Product;
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [gender, setGender] = useState(product?.gender ?? "");
  const [color, setColor] = useState(product?.color ?? "");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(product?.sizes ?? []);
  const [purchasePrice, setPurchasePrice] = useState(
    String(product?.purchase_price ?? 0)
  );
  const [sellingPrice, setSellingPrice] = useState(
    String(product?.selling_price ?? "")
  );
  const [discountPercent, setDiscountPercent] = useState(
    String(product?.discount_percent ?? 0)
  );
  const [quantity, setQuantity] = useState(
    String(product?.inventory?.quantity ?? 0)
  );
  const [sku, setSku] = useState(product?.sku ?? generateSKU());
  const [barcode, setBarcode] = useState(product?.barcode ?? generateBarcode());
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [images, setImages] = useState<FileList | null>(null);

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (images) {
      Array.from(images).forEach((file) => formData.append("images", file));
    }

    const input = {
      name,
      description: description || null,
      category_id: categoryId || null,
      brand: brand || null,
      gender: (gender || null) as Product["gender"],
      color: color || null,
      sizes: selectedSizes,
      purchase_price: parseFloat(purchasePrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      discount_percent: parseFloat(discountPercent) || 0,
      sku,
      barcode,
      is_active: isActive,
      initial_quantity: parseInt(quantity, 10) || 0,
    };

    const result = isEdit
      ? await updateProduct({ id: product.id, ...input }, formData)
      : await createProduct(input, formData);

    if (result.success) {
      toast.success(isEdit ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to save product");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-zinc-700 bg-zinc-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="border-zinc-700 bg-zinc-800 text-white"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Brand</Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Color</Label>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                    selectedSizes.includes(size)
                      ? "border-[#16A34A] bg-[#16A34A]/20 text-[#16A34A]"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">Purchase Price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Selling Price *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Discount %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
          </div>
          {!isEdit && (
            <div className="space-y-2">
              <Label className="text-zinc-300">Initial Quantity</Label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">SKU</Label>
              <div className="flex gap-2">
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 border-zinc-700"
                  onClick={() => setSku(generateSKU())}
                >
                  Gen
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Barcode</Label>
              <div className="flex gap-2">
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 border-zinc-700"
                  onClick={() => setBarcode(generateBarcode())}
                >
                  Gen
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Product Images</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(e.target.files)}
              className="border-zinc-700 bg-zinc-800 text-white file:text-zinc-300"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="text-zinc-300">Active</Label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          className="bg-[#16A34A] hover:bg-[#16A34A]/90"
          disabled={loading}
        >
          {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-zinc-700"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
