"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureBucket } from "@/lib/supabase/storage-setup";
import { increaseStock } from "@/lib/inventory";
import { generateBarcode, generateSKU } from "@/lib/utils";
import type { BusyImport, ImportReportItem } from "@/types/database";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface BusyParsedItem {
  product_name: string;
  barcode: string;
  quantity: number;
  sku: string | null;
  mrp: number;
  selling_price: number;
}

export interface BusyParseResult {
  items: BusyParsedItem[];
  rawText: string;
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/[,₹\s]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function extractBusyItems(text: string): BusyParsedItem[] {
  const items: BusyParsedItem[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const headerPatterns = /item\s*name|particulars|description|s\.?\s*no|sr\.?\s*no/i;
  const footerPatterns = /total|grand\s*total|sub\s*total|page\s*\d|printed\s*on/i;

  let inDataSection = false;

  for (const line of lines) {
    if (headerPatterns.test(line) && !inDataSection) {
      inDataSection = true;
      continue;
    }

    if (footerPatterns.test(line) && inDataSection) {
      break;
    }

    if (!inDataSection) continue;

    const parsed = parseBusyLine(line);
    if (parsed) {
      items.push(parsed);
    }
  }

  if (items.length === 0) {
    for (const line of lines) {
      const parsed = parseBusyLine(line);
      if (parsed) {
        items.push(parsed);
      }
    }
  }

  return items;
}

function parseBusyLine(line: string): BusyParsedItem | null {
  const barcodeMatch = line.match(/\b(890\d{10}|\d{8,14})\b/);
  const barcode = barcodeMatch?.[1];

  const priceMatches = line.match(/(\d+(?:\.\d{1,2})?)/g);
  if (!priceMatches || priceMatches.length < 1) return null;

  const numbers = priceMatches.map(parseNumber);
  let quantity = 1;
  let mrp = 0;
  let sellingPrice = 0;

  if (numbers.length >= 3) {
    quantity = numbers[numbers.length - 3] || 1;
    mrp = numbers[numbers.length - 2] || 0;
    sellingPrice = numbers[numbers.length - 1] || 0;
  } else if (numbers.length === 2) {
    mrp = numbers[0];
    sellingPrice = numbers[1];
  } else {
    sellingPrice = numbers[0];
    mrp = numbers[0];
  }

  let productName = line;
  if (barcode) {
    productName = productName.replace(barcode, "");
  }
  for (const num of priceMatches) {
    productName = productName.replace(num, "");
  }

  productName = productName
    .replace(/^\d+[\.\)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!productName || productName.length < 2) return null;

  const skuMatch = productName.match(/\b([A-Z]{2,}-\w+)\b/i);
  const sku = skuMatch?.[1] ?? null;

  return {
    product_name: productName,
    barcode: barcode || generateBarcode(),
    quantity: Math.max(1, Math.round(quantity)),
    sku,
    mrp,
    selling_price: sellingPrice || mrp,
  };
}

export async function parseBusyPDF(formData: FormData): Promise<ActionResult<BusyParseResult>> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No PDF file provided" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      textParts.push(pageText);
    }

    const rawText = textParts.join("\n");
    const items = extractBusyItems(rawText);

    if (items.length === 0) {
      return { success: false, error: "No products found in PDF" };
    }

    return { success: true, data: { items, rawText } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse PDF";
    return { success: false, error: message };
  }
}

export async function processBusyImport(
  formData: FormData
): Promise<ActionResult<BusyImport>> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No PDF file provided" };
    }

    const parseResult = await parseBusyPDF(formData);
    if (!parseResult.success || !parseResult.data) {
      return { success: false, error: parseResult.error || "Failed to parse PDF" };
    }

    const supabase = createAdminClient();
    const { items } = parseResult.data;
    const report: ImportReportItem[] = [];
    let addedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    let fileUrl: string | null = null;
    const filePath = `busy/${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();

    await ensureBucket("imports");
    const { error: uploadError } = await supabase.storage
      .from("imports")
      .upload(filePath, fileBuffer, { contentType: "application/pdf" });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("imports").getPublicUrl(filePath);
      fileUrl = publicUrl;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = i + 1;

      try {
        const { data: existing } = await supabase
          .from("products")
          .select("id, selling_price, purchase_price")
          .eq("barcode", item.barcode)
          .maybeSingle();

        if (existing) {
          const { error: updateError } = await supabase
            .from("products")
            .update({
              name: item.product_name,
              selling_price: item.selling_price,
              purchase_price: item.mrp,
              sku: item.sku || undefined,
            })
            .eq("id", existing.id);

          if (updateError) {
            failedCount++;
            report.push({
              row,
              product_name: item.product_name,
              barcode: item.barcode,
              status: "failed",
              message: updateError.message,
            });
            continue;
          }

          const stockResult = await increaseStock(
            existing.id,
            item.quantity,
            "import",
            "busy_import",
            undefined
          );

          if (!stockResult.success) {
            failedCount++;
            report.push({
              row,
              product_name: item.product_name,
              barcode: item.barcode,
              status: "failed",
              message: stockResult.error,
            });
            continue;
          }

          updatedCount++;
          report.push({
            row,
            product_name: item.product_name,
            barcode: item.barcode,
            status: "updated",
          });
        } else {
          const { data: newProduct, error: createError } = await supabase
            .from("products")
            .insert({
              name: item.product_name,
              selling_price: item.selling_price,
              purchase_price: item.mrp,
              sku: item.sku || generateSKU(),
              barcode: item.barcode,
              barcode_type: "code128",
              is_active: true,
            })
            .select()
            .single();

          if (createError || !newProduct) {
            failedCount++;
            report.push({
              row,
              product_name: item.product_name,
              barcode: item.barcode,
              status: "failed",
              message: createError?.message || "Failed to create product",
            });
            continue;
          }

          await supabase.from("inventory").insert({
            product_id: newProduct.id,
            quantity: item.quantity,
          });

          await supabase.from("barcodes").insert({
            product_id: newProduct.id,
            barcode_value: item.barcode,
            barcode_type: "code128",
          });

          addedCount++;
          report.push({
            row,
            product_name: item.product_name,
            barcode: item.barcode,
            status: "added",
          });
        }
      } catch (itemErr) {
        failedCount++;
        report.push({
          row,
          product_name: item.product_name,
          barcode: item.barcode,
          status: "failed",
          message: itemErr instanceof Error ? itemErr.message : "Unknown error",
        });
      }
    }

    const { data: importRecord, error: importError } = await supabase
      .from("busy_imports")
      .insert({
        file_name: file.name,
        file_url: fileUrl,
        total_rows: items.length,
        added_count: addedCount,
        updated_count: updatedCount,
        failed_count: failedCount,
        import_report: report,
        status: failedCount === items.length ? "failed" : "completed",
      })
      .select()
      .single();

    if (importError || !importRecord) {
      return { success: false, error: importError?.message || "Failed to save import record" };
    }

    return { success: true, data: importRecord as BusyImport };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process import";
    return { success: false, error: message };
  }
}
