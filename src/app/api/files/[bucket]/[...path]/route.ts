import { NextResponse } from "next/server";

import { storage } from "@/lib/db/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bucket: string; path: string[] }> }
) {
  const { bucket, path } = await params;
  const filePath = path.join("/");
  const result = await storage.from(bucket).download(filePath);

  if (result.error || !result.data) {
    return NextResponse.json({ error: result.error?.message ?? "Not found" }, { status: 404 });
  }

  return new NextResponse(result.data, {
    headers: {
      "Content-Type": result.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
