"use client";

import { useRef } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { barcodeToDataURL } from "@/lib/barcode";
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
import { useState } from "react";

interface BarcodeRow {
  id: string;
  barcode_value: string;
  barcode_type: string;
  image_url: string | null;
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
}

interface BarcodesTableProps {
  barcodes: BarcodeRow[];
}

export function BarcodesTable({ barcodes }: BarcodesTableProps) {
  const [search, setSearch] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = barcodes.filter((b) => {
    const q = search.toLowerCase();
    return (
      !q ||
      b.barcode_value.toLowerCase().includes(q) ||
      b.product?.name.toLowerCase().includes(q) ||
      b.product?.sku?.toLowerCase().includes(q)
    );
  });

  async function downloadPNG(row: BarcodeRow) {
    try {
      if (row.image_url) {
        const a = document.createElement("a");
        a.href = row.image_url;
        a.download = `barcode-${row.barcode_value}.png`;
        a.click();
        return;
      }
      const dataUrl = await barcodeToDataURL(
        row.barcode_value,
        row.barcode_type as "code128" | "ean13" | "qrcode"
      );
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `barcode-${row.barcode_value}.png`;
      a.click();
      toast.success("PNG downloaded");
    } catch {
      toast.error("Failed to generate barcode");
    }
  }

  async function downloadPDF(row: BarcodeRow) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups");
      return;
    }
    let imgSrc = row.image_url ?? "";
    if (!imgSrc) {
      imgSrc = await barcodeToDataURL(
        row.barcode_value,
        row.barcode_type as "code128" | "ean13" | "qrcode"
      );
    }
    printWindow.document.write(`
      <html><head><title>Barcode ${row.barcode_value}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px">
      <h2>${row.product?.name ?? "Product"}</h2>
      <p>SKU: ${row.product?.sku ?? "—"}</p>
      <img src="${imgSrc}" alt="barcode" style="max-width:100%"/>
      <p>${row.barcode_value}</p>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  function handlePrintAll() {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups");
      return;
    }
    printWindow.document.write(`
      <html><head><title>Barcodes</title>
      <style>body{font-family:sans-serif}.item{page-break-inside:avoid;text-align:center;padding:20px;border-bottom:1px solid #ccc}
      img{max-width:300px}</style></head><body>
      ${printRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search barcodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm border-zinc-700 bg-zinc-800 text-white"
        />
        <Button
          variant="outline"
          className="border-zinc-700"
          onClick={handlePrintAll}
        >
          <Printer className="h-4 w-4" />
          Print All
        </Button>
      </div>

      <div className="hidden" ref={printRef}>
        {filtered.map((row) => (
          <div key={row.id} className="item">
            <h3>{row.product?.name}</h3>
            {row.image_url && <img src={row.image_url} alt="" />}
            <p>{row.barcode_value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Product</TableHead>
              <TableHead className="text-zinc-400">Barcode</TableHead>
              <TableHead className="text-zinc-400">Type</TableHead>
              <TableHead className="text-zinc-400">Preview</TableHead>
              <TableHead className="text-right text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id} className="border-zinc-800">
                <TableCell>
                  <p className="font-medium text-zinc-100">
                    {row.product?.name ?? "—"}
                  </p>
                  <p className="text-xs text-zinc-500">{row.product?.sku}</p>
                </TableCell>
                <TableCell className="font-mono text-zinc-300">
                  {row.barcode_value}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.barcode_type}</Badge>
                </TableCell>
                <TableCell>
                  {row.image_url ? (
                    <img
                      src={row.image_url}
                      alt=""
                      className="h-10 max-w-[120px] object-contain"
                    />
                  ) : (
                    <span className="text-xs text-zinc-500">No image</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => downloadPNG(row)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                      onClick={() => downloadPDF(row)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
