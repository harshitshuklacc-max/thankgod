import type { MetadataRoute } from "next";

import { createAdminClient } from "@/lib/supabase/admin";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shoemafia.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const supabase = createAdminClient();

    const [{ data: categories }, { data: products }] = await Promise.all([
      supabase
        .from("categories")
        .select("slug, updated_at")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("id, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
    ]);

    const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map((category) => ({
      url: `${siteUrl}/categories/${category.slug}`,
      lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const productPages: MetadataRoute.Sitemap = (products ?? []).map((product) => ({
      url: `${siteUrl}/products/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticPages, ...categoryPages, ...productPages];
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return staticPages;
  }
}
