import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

interface InventoryRow {
  product_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  brand: string | null;
  gender: string | null;
  color: string | null;
  purchase_price: number;
  selling_price: number;
  discount_percent: number;
  quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  total_sold: number;
}

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 8, fontFamily: "Helvetica" },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 12 },
  header: { flexDirection: "row", backgroundColor: "#eee", padding: 4, fontWeight: "bold" },
  row: { flexDirection: "row", padding: 4, borderBottomWidth: 1, borderBottomColor: "#eee" },
  col: { flex: 1 },
});

async function fetchInventoryRows(): Promise<InventoryRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(name), inventory(quantity, low_stock_threshold)")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((product) => {
    const inventory = Array.isArray(product.inventory)
      ? product.inventory[0]
      : product.inventory;
    const category = Array.isArray(product.category)
      ? product.category[0]
      : product.category;

    return {
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: category?.name ?? null,
      brand: product.brand,
      gender: product.gender,
      color: product.color,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      discount_percent: product.discount_percent,
      quantity: inventory?.quantity ?? 0,
      low_stock_threshold: inventory?.low_stock_threshold ?? 5,
      is_active: product.is_active,
      total_sold: product.total_sold,
    };
  });
}

function rowsToCSV(rows: InventoryRow[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]) as (keyof InventoryRow)[];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const str = value === null || value === undefined ? "" : String(value);
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];

  return lines.join("\n");
}

function InventoryPDF({ rows }: { rows: InventoryRow[] }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>SHOE MAFIA — Inventory Export</Text>
        <View style={pdfStyles.header}>
          <Text style={[pdfStyles.col, { flex: 2 }]}>Name</Text>
          <Text style={pdfStyles.col}>SKU</Text>
          <Text style={pdfStyles.col}>Category</Text>
          <Text style={pdfStyles.col}>Qty</Text>
          <Text style={pdfStyles.col}>Price</Text>
          <Text style={pdfStyles.col}>Sold</Text>
        </View>
        {rows.map((row) => (
          <View key={row.product_id} style={pdfStyles.row}>
            <Text style={[pdfStyles.col, { flex: 2 }]}>{row.name}</Text>
            <Text style={pdfStyles.col}>{row.sku ?? "—"}</Text>
            <Text style={pdfStyles.col}>{row.category ?? "—"}</Text>
            <Text style={pdfStyles.col}>{row.quantity}</Text>
            <Text style={pdfStyles.col}>₹{row.selling_price}</Text>
            <Text style={pdfStyles.col}>{row.total_sold}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function GET(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "csv").toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    const rows = await fetchInventoryRows();

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="inventory-export-${timestamp}.xlsx"`,
        },
      });
    }

    if (format === "pdf") {
      const pdfBuffer = await renderToBuffer(<InventoryPDF rows={rows} />);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="inventory-export-${timestamp}.pdf"`,
        },
      });
    }

    if (format !== "csv") {
      return NextResponse.json(
        { error: "Invalid format. Use csv, xlsx, or pdf" },
        { status: 400 }
      );
    }

    const csv = rowsToCSV(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inventory-export-${timestamp}.csv"`,
      },
    });
  } catch (err) {
    console.error("Inventory export error:", err);
    const message = err instanceof Error ? err.message : "Failed to export inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
