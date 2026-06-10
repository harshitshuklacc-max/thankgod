import { InvoicesTable } from "@/components/admin/invoices-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Invoice } from "@/types/database";

export default async function AdminInvoicesPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  const invoices = (data ?? []) as Invoice[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Invoices</h1>
        <p className="mt-1 text-zinc-400">View, reprint, and download invoices</p>
      </div>
      <InvoicesTable invoices={invoices} />
    </div>
  );
}
