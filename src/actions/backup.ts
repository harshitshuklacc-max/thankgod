"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureBucket } from "@/lib/supabase/storage-setup";
import { getAdminSession } from "@/lib/auth/admin";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface BackupRecord {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  backup_type: string;
  status: string;
  created_at: string;
}

const BACKUP_TABLES = [
  "categories",
  "products",
  "product_images",
  "inventory",
  "inventory_logs",
  "barcodes",
  "orders",
  "order_items",
  "invoices",
  "invoice_items",
  "reviews",
  "settings",
  "busy_imports",
] as const;

async function collectBackupData(): Promise<Record<string, unknown>> {
  const supabase = createAdminClient();
  const backup: Record<string, unknown> = {};

  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw new Error(`Failed to backup ${table}: ${error.message}`);
    backup[table] = data || [];
  }

  backup._meta = {
    created_at: new Date().toISOString(),
    version: "1.0",
    tables: BACKUP_TABLES,
  };

  return backup;
}

export async function createBackup(): Promise<ActionResult<BackupRecord>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();
    const backupData = await collectBackupData();
    const jsonContent = JSON.stringify(backupData, null, 2);
    const buffer = Buffer.from(jsonContent, "utf-8");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.json`;
    const filePath = `full/${fileName}`;

    await ensureBucket("backups");
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(filePath, buffer, {
        contentType: "application/json",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("backups").getPublicUrl(filePath);

    const { data: record, error: recordError } = await supabase
      .from("backups")
      .insert({
        file_name: fileName,
        file_url: publicUrl,
        file_size: buffer.length,
        backup_type: "full",
        status: "completed",
      })
      .select()
      .single();

    if (recordError || !record) {
      return { success: false, error: recordError?.message || "Failed to save backup record" };
    }

    return { success: true, data: record as BackupRecord };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create backup";
    return { success: false, error: message };
  }
}

export async function listBackups(): Promise<ActionResult<BackupRecord[]>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("backups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as BackupRecord[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list backups";
    return { success: false, error: message };
  }
}

export async function restoreBackup(backupId: string): Promise<ActionResult> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createAdminClient();

    const { data, error: fetchError } = await supabase
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .single();

    if (fetchError || !data) {
      return { success: false, error: fetchError?.message || "Backup not found" };
    }

    // Cast the returned record to our explicit BackupRecord interface
    const backupRecord = data as unknown as BackupRecord;

    const filePath =
      backupRecord.file_url.split("/api/files/backups/")[1] ??
      backupRecord.file_url.split("/backups/")[1];
    if (!filePath) {
      return { success: false, error: "Invalid backup file URL" };
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("backups")
      .download(filePath);

    if (downloadError || !fileData) {
      return { success: false, error: downloadError?.message || "Failed to download backup" };
    }

    const jsonText = await fileData.text();
    const backupData = JSON.parse(jsonText) as Record<string, unknown>;

    const restoreOrder = [...BACKUP_TABLES].reverse();

    for (const table of restoreOrder) {
      const rows = backupData[table];
      if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

      await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const { error: insertError } = await supabase.from(table).insert(rows);
      if (insertError) {
        return { success: false, error: `Failed to restore ${table}: ${insertError.message}` };
      }
    }

    await supabase.from("audit_logs").insert({
      action: "restore_backup",
      entity_type: "backup",
      entity_id: backupId,
      details: { file_name: backupRecord.file_name },
      performed_by: session,
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to restore backup";
    return { success: false, error: message };
  }
}
