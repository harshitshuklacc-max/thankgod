"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Upload } from "lucide-react";
import { toast } from "sonner";

import { parseBusyPDF, processBusyImport } from "@/actions/busy-import";
import type { BusyParsedItem } from "@/actions/busy-import";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { BusyImport, ImportReportItem } from "@/types/database";

interface BusyImportFormProps {
  history: BusyImport[];
}

export function BusyImportForm({ history }: BusyImportFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BusyParsedItem[]>([]);
  const [report, setReport] = useState<ImportReportItem[] | null>(null);
  const [importResult, setImportResult] = useState<BusyImport | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleParse() {
    if (!file) {
      toast.error("Select a PDF file first");
      return;
    }
    setParsing(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await parseBusyPDF(formData);
    if (result.success && result.data) {
      setPreview(result.data.items);
      toast.success(`Found ${result.data.items.length} items`);
    } else {
      toast.error(result.error || "Failed to parse PDF");
    }
    setParsing(false);
  }

  async function handleImport() {
    if (!file) {
      toast.error("Select a PDF file first");
      return;
    }
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    const result = await processBusyImport(formData);
    if (result.success && result.data) {
      setImportResult(result.data);
      setReport(result.data.import_report as ImportReportItem[]);
      toast.success(
        `Import complete: ${result.data.added_count} added, ${result.data.updated_count} updated, ${result.data.failed_count} failed`
      );
      router.refresh();
    } else {
      toast.error(result.error || "Import failed");
    }
    setImporting(false);
  }

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Upload className="h-5 w-5 text-[#16A34A]" />
            Upload BUSY Stock PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setPreview([]);
                  setReport(null);
                  setImportResult(null);
                }}
                className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-md file:border-0 file:bg-[#16A34A] file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-[#16A34A]/90"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-zinc-700"
                disabled={!file || parsing}
                onClick={handleParse}
              >
                <FileUp className="h-4 w-4" />
                {parsing ? "Parsing..." : "Preview"}
              </Button>
              <Button
                className="bg-[#16A34A] hover:bg-[#16A34A]/90"
                disabled={!file || importing}
                onClick={handleImport}
              >
                {importing ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">
              Parse Preview ({preview.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto rounded-lg border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">#</TableHead>
                    <TableHead className="text-zinc-400">Product</TableHead>
                    <TableHead className="text-zinc-400">Barcode</TableHead>
                    <TableHead className="text-zinc-400">Qty</TableHead>
                    <TableHead className="text-zinc-400">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((item, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell className="text-zinc-500">{i + 1}</TableCell>
                      <TableCell className="text-zinc-100">{item.product_name}</TableCell>
                      <TableCell className="text-zinc-300">{item.barcode}</TableCell>
                      <TableCell className="text-zinc-300">{item.quantity}</TableCell>
                      <TableCell className="text-zinc-300">
                        {formatCurrency(item.selling_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && report && (
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">Import Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Badge className="bg-green-600">{importResult.added_count} added</Badge>
              <Badge className="bg-blue-600">{importResult.updated_count} updated</Badge>
              <Badge variant="destructive" className="bg-[#16A34A]">
                {importResult.failed_count} failed
              </Badge>
            </div>
            <div className="max-h-60 overflow-auto rounded-lg border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Row</TableHead>
                    <TableHead className="text-zinc-400">Product</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.map((item) => (
                    <TableRow key={item.row} className="border-zinc-800">
                      <TableCell className="text-zinc-500">{item.row}</TableCell>
                      <TableCell className="text-zinc-100">{item.product_name}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status === "added"
                              ? "bg-green-600"
                              : item.status === "updated"
                                ? "bg-blue-600"
                                : "bg-[#16A34A]"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400">
                        {item.message ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-zinc-100">Import History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-zinc-500">No imports yet</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-zinc-100">{item.file_name}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-green-600">+{item.added_count}</Badge>
                    <Badge className="bg-blue-600">↻{item.updated_count}</Badge>
                    {item.failed_count > 0 && (
                      <Badge variant="destructive" className="bg-[#16A34A]">
                        ✕{item.failed_count}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
