"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureBucket } from "@/lib/supabase/storage-setup";
import { createClient } from "@/lib/supabase/server";
import { generateBarcodeServer } from "@/lib/barcode";
import { generateBarcode, generateSKU } from "@/lib/utils";
import type { Product } from "@/types/database";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface CreateProductInput {
  name: string;
  description?: string | null;
  category_id?: string | null;
  brand?: string | null;
  gender?: Product["gender"];
  color?: string | null;
  sizes?: string[];
  purchase_price?: number;
  selling_price: number;
  discount_percent?: number;
  sku?: string | null;
  barcode?: string | null;
  barcode_type?: Product["barcode_type"];
  initial_quantity?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_trending?: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface ProductFilters {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

async function uploadProductImages(
  productId: string,
  formData: FormData
): Promise<{ urls: string[]; error?: string }> {
  await ensureBucket("products");
  const supabase = createAdminClient();
  const urls: string[] = [];
  const files = formData.getAll("images") as File[];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file || !(file instanceof File) || file.size === 0) continue;

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${productId}/${Date.now()}-${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      return { urls, error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("products").getPublicUrl(path);

    urls.push(publicUrl);
  }

  return { urls };
}

async function createBarcodeRecord(
  productId: string,
  barcodeValue: string,
  barcodeType: Product["barcode_type"]
): Promise<{ imageUrl: string | null; error?: string }> {
  const supabase = createAdminClient();

  try {
    await ensureBucket("products");
    const pngBuffer = await generateBarcodeServer(barcodeValue, barcodeType);
    const path = `barcodes/${productId}.png`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(path, pngBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    let imageUrl: string | null = null;
    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(path);
      imageUrl = publicUrl;
    }

    const { error } = await supabase.from("barcodes").insert({
      product_id: productId,
      barcode_value: barcodeValue,
      barcode_type: barcodeType,
      image_url: imageUrl,
    });

    if (error) {
      return { imageUrl: null, error: error.message };
    }

    return { imageUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create barcode";
    return { imageUrl: null, error: message };
  }
}

export async function createProduct(
  input: CreateProductInput,
  formData?: FormData
): Promise<ActionResult<Product>> {
  try {
    const supabase = createAdminClient();
    const barcode = input.barcode?.trim() || generateBarcode();
    const barcodeType = input.barcode_type || "code128";
    const sku = input.sku?.trim() || generateSKU();

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name: input.name,
        description: input.description ?? null,
        category_id: input.category_id ?? null,
        brand: input.brand ?? null,
        gender: input.gender ?? null,
        color: input.color ?? null,
        sizes: input.sizes ?? [],
        purchase_price: input.purchase_price ?? 0,
        selling_price: input.selling_price,
        discount_percent: input.discount_percent ?? 0,
        sku,
        barcode,
        barcode_type: barcodeType,
        is_active: input.is_active ?? true,
        is_featured: input.is_featured ?? false,
        is_trending: input.is_trending ?? false,
        is_new_arrival: input.is_new_arrival ?? false,
        is_best_seller: input.is_best_seller ?? false,
      })
      .select()
      .single();

    if (productError || !product) {
      return { success: false, error: productError?.message || "Failed to create product" };
    }

    const { error: inventoryError } = await supabase.from("inventory").insert({
      product_id: product.id,
      quantity: input.initial_quantity ?? 0,
      low_stock_threshold: input.low_stock_threshold ?? 5,
    });

    if (inventoryError) {
      await supabase.from("products").delete().eq("id", product.id);
      return { success: false, error: inventoryError.message };
    }

    const barcodeResult = await createBarcodeRecord(product.id, barcode, barcodeType);
    if (barcodeResult.error) {
      return { success: false, error: barcodeResult.error };
    }

    if (formData) {
      const { urls, error: imageError } = await uploadProductImages(product.id, formData);
      if (imageError) {
        return { success: false, error: imageError };
      }

      if (urls.length > 0) {
        const imageRecords = urls.map((url, index) => ({
          product_id: product.id,
          image_url: url,
          alt_text: input.name,
          is_primary: index === 0,
          sort_order: index,
        }));

        const { error: imagesError } = await supabase
          .from("product_images")
          .insert(imageRecords);

        if (imagesError) {
          return { success: false, error: imagesError.message };
        }
      }
    }

    return { success: true, data: product as Product };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    return { success: false, error: message };
  }
}

export async function updateProduct(
  input: UpdateProductInput,
  formData?: FormData
): Promise<ActionResult<Product>> {
  try {
    const supabase = createAdminClient();
    const { id, ...updates } = input;

    const { data: product, error } = await supabase
      .from("products")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !product) {
      return { success: false, error: error?.message || "Failed to update product" };
    }

    if (formData) {
      const { urls, error: imageError } = await uploadProductImages(id, formData);
      if (imageError) {
        return { success: false, error: imageError };
      }

      if (urls.length > 0) {
        const { count } = await supabase
          .from("product_images")
          .select("*", { count: "exact", head: true })
          .eq("product_id", id);

        const imageRecords = urls.map((url, index) => ({
          product_id: id,
          image_url: url,
          alt_text: product.name,
          is_primary: (count ?? 0) === 0 && index === 0,
          sort_order: (count ?? 0) + index,
        }));

        const { error: imagesError } = await supabase
          .from("product_images")
          .insert(imageRecords);

        if (imagesError) {
          return { success: false, error: imagesError.message };
        }
      }
    }

    return { success: true, data: product as Product };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update product";
    return { success: false, error: message };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete product";
    return { success: false, error: message };
  }
}

export async function toggleProductStatus(id: string): Promise<ActionResult<Product>> {
  try {
    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("is_active")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: fetchError?.message || "Product not found" };
    }

    const { data: product, error } = await supabase
      .from("products")
      .update({ is_active: !existing.is_active })
      .eq("id", id)
      .select()
      .single();

    if (error || !product) {
      return { success: false, error: error?.message || "Failed to toggle status" };
    }

    return { success: true, data: product as Product };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to toggle product status";
    return { success: false, error: message };
  }
}

export async function getProducts(
  filters?: ProductFilters
): Promise<ActionResult<Product[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), inventory(*)")
      .order("created_at", { ascending: false });

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`
      );
    }

    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters?.is_featured !== undefined) {
      query = query.eq("is_featured", filters.is_featured);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Product[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch products";
    return { success: false, error: message };
  }
}

export async function getProductById(id: string): Promise<ActionResult<Product>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), inventory(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Product not found" };
    }

    return { success: true, data: data as Product };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch product";
    return { success: false, error: message };
  }
}

export async function getProductByBarcode(barcode: string): Promise<ActionResult<Product>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), inventory(*)")
      .eq("barcode", barcode)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Product not found" };
    }

    return { success: true, data: data as Product };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch product";
    return { success: false, error: message };
  }
}

export async function getCategories(): Promise<
  ActionResult<{ id: string; name: string; slug: string }[]>
> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data ?? [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch categories";
    return { success: false, error: message };
  }
}
