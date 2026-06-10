import { BarcodesTable } from "@/components/admin/barcodes-table";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminBarcodesPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("barcodes")
    .select("id, barcode_value, barcode_type, image_url, product:products(id, name, sku)")
    .order("created_at", { ascending: false });

  const barcodes = (data ?? []).map((row) => ({
    ...row,
    product: Array.isArray(row.product) ? row.product[0] : row.product,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Barcodes</h1>
        <p className="mt-1 text-zinc-400">Download, print, and manage product barcodes</p>
      </div>
      <BarcodesTable barcodes={barcodes} />
    </div>
  );
}
