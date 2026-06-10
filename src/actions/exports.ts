"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface InventoryExportRow {
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

export interface ExportResult {
  filename: string;
  content: string;
  mimeType: string;
}

async function fetchInventoryData(): Promise<InventoryExportRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(name), inventory(quantity, low_stock_threshold)")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((product) => {
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

function rowsToCSV(rows: InventoryExportRow[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]) as (keyof InventoryExportRow)[];
  const csvLines = [
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

  return csvLines.join("\n");
}

export async function exportInventoryCSV(): Promise<ActionResult<ExportResult>> {
  try {
    const rows = await fetchInventoryData();
    const timestamp = new Date().toISOString().slice(0, 10);
    const content = rowsToCSV(rows);

    return {
      success: true,
      data: {
        filename: `inventory-export-${timestamp}.csv`,
        content,
        mimeType: "text/csv",
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to export CSV";
    return { success: false, error: message };
  }
}

export async function exportInventoryXLSX(): Promise<ActionResult<ExportResult>> {
  try {
    const rows = await fetchInventoryData();
    const timestamp = new Date().toISOString().slice(0, 10);

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    const buffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    return {
      success: true,
      data: {
        filename: `inventory-export-${timestamp}.xlsx`,
        content: buffer,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to export XLSX";
    return { success: false, error: message };
  }
}
