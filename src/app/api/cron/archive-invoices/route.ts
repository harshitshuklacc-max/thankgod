import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: archivedCount, error } = await supabase.rpc("archive_old_invoices");

    if (error) {
      return NextResponse.json(
        { error: "Failed to archive invoices", details: error.message },
        { status: 500 }
      );
    }

    await supabase.from("audit_logs").insert({
      action: "archive_invoices_cron",
      entity_type: "invoices",
      details: { archived_count: archivedCount ?? 0 },
      performed_by: "cron",
    });

    return NextResponse.json({
      success: true,
      archived_count: archivedCount ?? 0,
      executed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Archive invoices cron error:", err);
    const message = err instanceof Error ? err.message : "Cron job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
