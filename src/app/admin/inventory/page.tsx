import { InventoryTable } from "@/components/admin/inventory-table";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminInventoryPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("products")
    .select("id, name, sku, barcode, brand, selling_price, is_active, category:categories(name), inventory(quantity, low_stock_threshold)")
    .order("name");

  const rows = (data ?? []).map((product) => {
    const inventory = Array.isArray(product.inventory)
      ? product.inventory[0]
      : product.inventory;
    const category = Array.isArray(product.category)
      ? product.category[0]
      : product.category;

    return {
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: category?.name ?? null,
      brand: product.brand,
      quantity: inventory?.quantity ?? 0,
      low_stock_threshold: inventory?.low_stock_threshold ?? 5,
      selling_price: product.selling_price,
      is_active: product.is_active,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Inventory</h1>
        <p className="mt-1 text-zinc-400">Stock levels and export tools</p>
      </div>
      <InventoryTable rows={rows} />
    </div>
  );
}
