import { BusyImportForm } from "@/components/admin/busy-import-form";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BusyImport } from "@/types/database";

export default async function BusyImportPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("busy_imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const history = (data ?? []) as BusyImport[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">BUSY Stock Import</h1>
        <p className="mt-1 text-zinc-400">
          Upload BUSY accounting PDFs to import stock
        </p>
      </div>
      <BusyImportForm history={history} />
    </div>
  );
}
