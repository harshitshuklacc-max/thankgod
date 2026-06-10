"use client";

import { useState } from "react";
import { Download, Eye, Printer } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Invoice, InvoiceItem } from "@/types/database";

interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Invoice | null>(null);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      !q ||
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.customer_phone?.toLowerCase().includes(q)
    );
  });

  function buildInvoiceHtml(invoice: Invoice, items: InvoiceItem[]) {
    return `
      <html><head><title>Invoice ${invoice.invoice_number}</title>
      <style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px}
      h1{color:#16A34A}table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}
      .total{text-align:right;font-size:1.2em;font-weight:bold;margin-top:20px}</style></head>
      <body>
      <h1>SHOE MAFIA</h1>
      <p><strong>Invoice:</strong> ${invoice.invoice_number}</p>
      <p><strong>Date:</strong> ${formatDateTime(invoice.created_at)}</p>
      <p><strong>Customer:</strong> ${invoice.customer_name ?? "Walk-in"}</p>
      <p><strong>Phone:</strong> ${invoice.customer_phone ?? "—"}</p>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${items.map((i) => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>${formatCurrency(i.unit_price)}</td><td>${formatCurrency(i.total_price)}</td></tr>`).join("")}
      </tbody></table>
      <p class="total">Grand Total: ${formatCurrency(invoice.grand_total)}</p>
      </body></html>`;
  }

  function handleView(invoice: Invoice) {
    setViewing(invoice);
  }

  function handlePrint(invoice: Invoice) {
    const items = invoice.invoice_items ?? [];
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups");
      return;
    }
    printWindow.document.write(buildInvoiceHtml(invoice, items));
    printWindow.document.close();
    printWindow.print();
  }

  function handleDownload(invoice: Invoice) {
    const items = invoice.invoice_items ?? [];
    const html = buildInvoiceHtml(invoice, items);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoice_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded");
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search invoices..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm border-zinc-700 bg-zinc-800 text-white"
      />

      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Invoice #</TableHead>
              <TableHead className="text-zinc-400">Customer</TableHead>
              <TableHead className="text-zinc-400">Type</TableHead>
              <TableHead className="text-zinc-400">Total</TableHead>
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-right text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((invoice) => (
              <TableRow key={invoice.id} className="border-zinc-800">
                <TableCell className="font-medium text-zinc-100">
                  {invoice.invoice_number}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {invoice.customer_name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {invoice.invoice_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {formatCurrency(invoice.grand_total)}
                </TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {formatDateTime(invoice.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => handleView(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => handlePrint(invoice)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => handleDownload(invoice)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Invoice {viewing.invoice_number}
              </h2>
              <Button
                variant="ghost"
                className="text-zinc-400"
                onClick={() => setViewing(null)}
              >
                Close
              </Button>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <p>Customer: {viewing.customer_name ?? "Walk-in"}</p>
              <p>Phone: {viewing.customer_phone ?? "—"}</p>
              <p>Date: {formatDateTime(viewing.created_at)}</p>
              <p>Type: {viewing.invoice_type}</p>
            </div>
            {(viewing.invoice_items ?? []).length > 0 && (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Product</TableHead>
                    <TableHead className="text-zinc-400">Qty</TableHead>
                    <TableHead className="text-zinc-400">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewing.invoice_items!.map((item) => (
                    <TableRow key={item.id} className="border-zinc-800">
                      <TableCell className="text-zinc-100">{item.product_name}</TableCell>
                      <TableCell className="text-zinc-300">{item.quantity}</TableCell>
                      <TableCell className="text-zinc-300">
                        {formatCurrency(item.total_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <p className="mt-4 text-right text-lg font-bold text-[#16A34A]">
              Total: {formatCurrency(viewing.grand_total)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
