import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import type { Customer } from "@/types/database";

export default async function AdminCustomersPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  const customers = (data ?? []) as Customer[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Customers</h1>
        <p className="mt-1 text-zinc-400">
          {customers.length} registered customers
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Phone</TableHead>
              <TableHead className="text-zinc-400">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-zinc-500">
                  No customers yet
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className="border-zinc-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {customer.avatar_url ? (
                        <img
                          src={customer.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                          {(customer.full_name ?? "?")[0]}
                        </div>
                      )}
                      <span className="font-medium text-zinc-100">
                        {customer.full_name ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {customer.phone ?? (
                      <Badge variant="secondary">No phone</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">
                    {formatDateTime(customer.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
