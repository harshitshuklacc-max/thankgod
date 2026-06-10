import { NextResponse } from "next/server";

import { generateBarcodeServer } from "@/lib/barcode";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BarcodeType } from "@/lib/barcode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type") as BarcodeType | null;

    const supabase = createAdminClient();

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, barcode, barcode_type, sku")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const barcodeValue = product.barcode ?? product.sku;
    if (!barcodeValue) {
      return NextResponse.json(
        { error: "Product has no barcode or SKU assigned" },
        { status: 400 }
      );
    }

    const barcodeType = typeParam ?? (product.barcode_type as BarcodeType) ?? "code128";
    const pngBuffer = await generateBarcodeServer(barcodeValue, barcodeType);

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(`barcodes/${productId}.png`, pngBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage
        .from("products")
        .getPublicUrl(`barcodes/${productId}.png`);

      await supabase.from("barcodes").upsert(
        {
          product_id: productId,
          barcode_value: barcodeValue,
          barcode_type: barcodeType,
          image_url: publicUrl.publicUrl,
        },
        { onConflict: "product_id" }
      );
    }

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="barcode-${productId}.png"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Barcode generation error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate barcode";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
