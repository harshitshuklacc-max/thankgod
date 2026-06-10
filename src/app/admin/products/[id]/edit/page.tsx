import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category, Product } from "@/types/database";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [productRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*), images:product_images(*), inventory(*)")
      .eq("id", id)
      .single(),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (!productRes.data) notFound();

  const product = productRes.data as Product;
  const categories = (categoriesRes.data ?? []) as Category[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Edit Product</h1>
        <p className="mt-1 text-zinc-400">{product.name}</p>
      </div>
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-zinc-100">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm categories={categories} product={product} />
        </CardContent>
      </Card>
    </div>
  );
}
