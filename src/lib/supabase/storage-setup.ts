import { createAdminClient } from "@/lib/supabase/admin";

const REQUIRED_BUCKETS = [
  {
    id: "products",
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  {
    id: "invoices",
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
  },
  {
    id: "imports",
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: [
      "application/pdf",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  {
    id: "backups",
    public: false,
    fileSizeLimit: 100 * 1024 * 1024,
  },
] as const;

let bucketsEnsured = false;

export async function ensureStorageBuckets(): Promise<{
  success: boolean;
  created: string[];
  errors: string[];
}> {
  if (bucketsEnsured) {
    return { success: true, created: [], errors: [] };
  }

  const supabase = createAdminClient();
  const created: string[] = [];
  const errors: string[] = [];

  const { data: existingBuckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    return { success: false, created, errors: [listError.message] };
  }

  const existingIds = new Set((existingBuckets ?? []).map((b) => b.id));

  for (const bucket of REQUIRED_BUCKETS) {
    if (existingIds.has(bucket.id)) continue;

    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: "allowedMimeTypes" in bucket ? bucket.allowedMimeTypes : undefined,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("already exists") ||
        error.message.toLowerCase().includes("duplicate")
      ) {
        continue;
      }
      errors.push(`${bucket.id}: ${error.message}`);
    } else {
      created.push(bucket.id);
    }
  }

  if (errors.length === 0) {
    bucketsEnsured = true;
  }

  return { success: errors.length === 0, created, errors };
}

export async function ensureBucket(bucketId: string): Promise<void> {
  const result = await ensureStorageBuckets();
  if (!result.success) {
    const bucketError = result.errors.find((e) => e.startsWith(bucketId));
    if (bucketError) {
      throw new Error(`Storage bucket "${bucketId}" not found. ${bucketError}`);
    }
  }
}
