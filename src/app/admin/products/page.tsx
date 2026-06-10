import { ProductsTable } from "@/components/admin/products-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category, Product } from "@/types/database";

export default async function AdminProductsPage() {
  const supabase = createAdminClient();

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), inventory(*)")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name"),
  ]);

  const products = (productsRes.data ?? []) as Product[];
  const categories = (categoriesRes.data ?? []) as Category[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Products</h1>
        <p className="mt-1 text-zinc-400">Manage your product catalog</p>
      </div>
      <ProductsTable products={products} categories={categories} />
    </div>
  );
}
