"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

import { exportInventoryCSV, exportInventoryXLSX } from "@/actions/exports";
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
import { formatCurrency } from "@/lib/utils";

interface InventoryRow {
  product_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  brand: string | null;
  quantity: number;
  low_stock_threshold: number;
  selling_price: number;
  is_active: boolean;
}

interface InventoryTableProps {
  rows: InventoryRow[];
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const isBase64 = mimeType.includes("spreadsheet");
  const blob = isBase64
    ? new Blob([Uint8Array.from(atob(content), (c) => c.charCodeAt(0))], { type: mimeType })
    : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function InventoryTable({ rows }: InventoryTableProps) {
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    return (
      !q ||
      row.name.toLowerCase().includes(q) ||
      row.sku?.toLowerCase().includes(q) ||
      row.barcode?.toLowerCase().includes(q)
    );
  });

  const lowStockCount = rows.filter((r) => r.quantity <= r.low_stock_threshold).length;

  async function handleExport(type: "csv" | "xlsx" | "pdf") {
    setExporting(type);
    try {
      if (type === "csv") {
        const result = await exportInventoryCSV();
        if (result.success && result.data) {
          downloadFile(result.data.filename, result.data.content, result.data.mimeType);
          toast.success("CSV exported");
        } else {
          toast.error(result.error || "Export failed");
        }
      } else if (type === "xlsx") {
        const result = await exportInventoryXLSX();
        if (result.success && result.data) {
          downloadFile(result.data.filename, result.data.content, result.data.mimeType);
          toast.success("XLSX exported");
        } else {
          toast.error(result.error || "Export failed");
        }
      } else {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          toast.error("Please allow popups for PDF export");
          return;
        }
        const tableHtml = `
          <html><head><title>Inventory Export</title>
          <style>body{font-family:sans-serif}table{width:100%;border-collapse:collapse}
          th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f0f0f0}</style>
          </head><body><h1>SHOE MAFIA - Inventory</h1>
          <table><thead><tr>
          <th>Name</th><th>SKU</th><th>Barcode</th><th>Category</th><th>Qty</th><th>Price</th>
          </tr></thead><tbody>
          ${filtered.map((r) => `<tr><td>${r.name}</td><td>${r.sku ?? ""}</td><td>${r.barcode ?? ""}</td><td>${r.category ?? ""}</td><td>${r.quantity}</td><td>${r.selling_price}</td></tr>`).join("")}
          </tbody></table></body></html>`;
        printWindow.document.write(tableHtml);
        printWindow.document.close();
        printWindow.print();
        toast.success("PDF print dialog opened");
      }
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm border-zinc-700 bg-zinc-800 text-white"
          />
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="bg-[#16A34A]">
              {lowStockCount} low stock
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-zinc-700"
            disabled={!!exporting}
            onClick={() => handleExport("csv")}
          >
            <FileText className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            className="border-zinc-700"
            disabled={!!exporting}
            onClick={() => handleExport("xlsx")}
          >
            <FileSpreadsheet className="h-4 w-4" />
            XLSX
          </Button>
          <Button
            variant="outline"
            className="border-zinc-700"
            disabled={!!exporting}
            onClick={() => handleExport("pdf")}
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Product</TableHead>
              <TableHead className="text-zinc-400">SKU</TableHead>
              <TableHead className="text-zinc-400">Barcode</TableHead>
              <TableHead className="text-zinc-400">Category</TableHead>
              <TableHead className="text-zinc-400">Stock</TableHead>
              <TableHead className="text-zinc-400">Price</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const isLow = row.quantity <= row.low_stock_threshold;
              return (
                <TableRow key={row.product_id} className="border-zinc-800">
                  <TableCell className="font-medium text-zinc-100">{row.name}</TableCell>
                  <TableCell className="text-zinc-300">{row.sku}</TableCell>
                  <TableCell className="text-zinc-300">{row.barcode}</TableCell>
                  <TableCell className="text-zinc-300">{row.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={isLow ? "destructive" : "secondary"}
                      className={isLow ? "bg-[#16A34A]" : ""}
                    >
                      {row.quantity}
                      {isLow && " ⚠"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {formatCurrency(row.selling_price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.is_active ? "default" : "secondary"}>
                      {row.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
