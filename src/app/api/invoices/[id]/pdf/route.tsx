import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureBucket } from "@/lib/supabase/storage-setup";
import { formatCurrency, formatDate, STORE_INFO } from "@/lib/utils";
import type { Invoice, InvoiceItem } from "@/types/database";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "bold", color: "#16A34A" },
  subtitle: { fontSize: 12, marginTop: 4, color: "#666" },
  section: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 8,
    fontWeight: "bold",
    marginTop: 12,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  colProduct: { width: "40%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "25%", textAlign: "right" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", width: 200, justifyContent: "space-between", marginBottom: 4 },
  grandTotal: { fontWeight: "bold", fontSize: 12, marginTop: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", color: "#999", fontSize: 8 },
});

function InvoiceDocument({
  invoice,
  items,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{STORE_INFO.name}</Text>
          <Text style={styles.subtitle}>{STORE_INFO.address}</Text>
          <Text style={styles.subtitle}>Phone: {STORE_INFO.phone}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Invoice: {invoice.invoice_number}</Text>
            <Text>Date: {formatDate(invoice.created_at)}</Text>
          </View>
          {invoice.customer_name && (
            <Text>Customer: {invoice.customer_name}</Text>
          )}
          {invoice.customer_phone && (
            <Text>Phone: {invoice.customer_phone}</Text>
          )}
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colProduct}>Product</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit Price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colProduct}>{item.product_name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
            <Text style={styles.colTotal}>{formatCurrency(item.total_price)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.tax_amount > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax:</Text>
              <Text>{formatCurrency(invoice.tax_amount)}</Text>
            </View>
          )}
          {invoice.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-{formatCurrency(invoice.discount_amount)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Grand Total:</Text>
            <Text>{formatCurrency(invoice.grand_total)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Thank you for shopping at {STORE_INFO.name}!</Text>
      </Page>
    </Document>
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const supabase = createAdminClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const items = (invoice.invoice_items ?? []) as InvoiceItem[];
    const pdfBuffer = await renderToBuffer(
      <InvoiceDocument invoice={invoice as Invoice} items={items} />
    );

    const filename = `invoice-${invoice.invoice_number}.pdf`;

    await ensureBucket("invoices");
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(`${invoice.id}/${filename}`, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.warn("Failed to upload invoice PDF to storage:", uploadError.message);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Invoice PDF error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate invoice PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
