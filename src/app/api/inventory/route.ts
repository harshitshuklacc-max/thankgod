import { NextResponse } from "next/server";

import { from } from "@/lib/db/query-builder";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productIds = searchParams.get("productIds");

  let query = from("inventory").select("product_id, quantity");

  if (productIds) {
    const ids = productIds.split(",").filter(Boolean);
    if (ids.length) query = query.in("product_id", ids);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
