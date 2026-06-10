import { createClient } from "@/lib/supabase/server";
import type { Product, Review } from "@/types/database";

const PRODUCT_SELECT = `
  *,
  images:product_images(*),
  category:categories(*)
`;

export async function fetchProductsByFlag(
  flag: "is_new_arrival" | "is_featured" | "is_trending" | "is_best_seller",
  limit = 8
): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq(flag, true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Error fetching products (${flag}):`, error.message);
    return [];
  }

  return (data as Product[]) ?? [];
}

export async function fetchProductsByCategorySlug(
  slug: string,
  limit = 8
): Promise<Product[]> {
  const supabase = await createClient();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (categoryError || !category) {
    if (categoryError) {
      console.error(`Error fetching category (${slug}):`, categoryError.message);
    }
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Error fetching products for ${slug}:`, error.message);
    return [];
  }

  return (data as Product[]) ?? [];
}

export async function fetchApprovedReviews(limit = 6): Promise<Review[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*, customer:customers(*)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching reviews:", error.message);
    return [];
  }

  return (data as Review[]) ?? [];
}

export async function fetchActiveCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error.message);
    return [];
  }

  return data ?? [];
}
