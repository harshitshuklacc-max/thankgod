import { ProductForm } from "@/components/admin/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category } from "@/types/database";

export default async function NewProductPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  const categories = (data ?? []) as Category[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Add Product</h1>
        <p className="mt-1 text-zinc-400">Create a new product listing</p>
      </div>
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-zinc-100">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
