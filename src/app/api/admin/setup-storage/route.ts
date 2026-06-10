import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth/admin";
import { ensureStorageBuckets } from "@/lib/supabase/storage-setup";

export async function POST() {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await ensureStorageBuckets();

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to create some storage buckets",
          details: result.errors,
          hint: "Run supabase/migrations/003_storage_buckets.sql in Supabase SQL Editor",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        result.created.length > 0
          ? `Created buckets: ${result.created.join(", ")}`
          : "All storage buckets already exist",
      created: result.created,
      buckets: ["products", "invoices", "imports", "backups"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
