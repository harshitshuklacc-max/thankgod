"use client";

import { pdf } from "@react-pdf/renderer";
import { motion } from "framer-motion";
import { Download, Printer } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { InvoicePDFDocument, type InvoicePDFItem } from "@/lib/invoice-pdf";
import { formatCurrency, formatDateTime, STORE_INFO } from "@/lib/utils";

interface InvoicePreviewProps {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string | null;
  items: InvoicePDFItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  onClose?: () => void;
}

export function InvoicePreview({
  invoiceNumber,
  date,
  customerName,
  customerPhone,
  items,
  subtotal,
  taxAmount,
  discountAmount,
  grandTotal,
  onClose,
}: InvoicePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoiceNumber}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; max-width: 800px; margin: 0 auto; }
            h1 { color: #16A34A; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #000; color: #fff; }
            .totals { text-align: right; margin-top: 16px; }
            .grand { font-size: 1.2em; font-weight: bold; color: #16A34A; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = async () => {
    const blob = await pdf(
      <InvoicePDFDocument
        invoiceNumber={invoiceNumber}
        date={date}
        customerName={customerName}
        customerPhone={customerPhone}
        items={items}
        subtotal={subtotal}
        taxAmount={taxAmount}
        discountAmount={discountAmount}
        grandTotal={grandTotal}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoiceNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg rounded-2xl border border-border bg-card shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-bold">Sale Complete</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button type="button" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div ref={printRef} className="p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-primary">{STORE_INFO.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{STORE_INFO.address}</p>
          <p className="text-xs text-muted-foreground">Tel: {STORE_INFO.phone}</p>
        </div>

        <div className="mb-4 flex justify-between text-sm">
          <div>
            <p className="font-semibold">Invoice: {invoiceNumber}</p>
            <p className="text-muted-foreground">{formatDateTime(date)}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{customerName}</p>
            {customerPhone && (
              <p className="text-muted-foreground">{customerPhone}</p>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-border/50">
                <td className="p-2">{item.name}</td>
                <td className="p-2 text-center">{item.quantity}</td>
                <td className="p-2 text-right">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 text-right text-sm">
          <p>Subtotal: {formatCurrency(subtotal)}</p>
          {discountAmount > 0 && <p>Discount: -{formatCurrency(discountAmount)}</p>}
          <p>Tax: {formatCurrency(taxAmount)}</p>
          <p className="text-lg font-bold text-primary">
            Total: {formatCurrency(grandTotal)}
          </p>
        </div>
      </div>

      {onClose && (
        <div className="border-t border-border p-4">
          <Button type="button" className="w-full" onClick={onClose}>
            New Sale
          </Button>
        </div>
      )}
    </motion.div>
  );
}
