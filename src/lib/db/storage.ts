import "server-only";

import { getAppUrl } from "@/lib/env";
import { getSql } from "./neon";

interface BucketConfig {
  id: string;
  public: boolean;
}

const BUCKETS: BucketConfig[] = [
  { id: "products", public: true },
  { id: "invoices", public: false },
  { id: "imports", public: false },
  { id: "backups", public: false },
];

function toBuffer(data: Blob | ArrayBuffer | Buffer | File | Uint8Array): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return Promise.resolve(data);
  if (data instanceof ArrayBuffer) return Promise.resolve(Buffer.from(data));
  if (data instanceof Uint8Array) return Promise.resolve(Buffer.from(data));
  if (data instanceof Blob || (typeof File !== "undefined" && data instanceof File)) {
    return data.arrayBuffer().then((ab) => Buffer.from(ab));
  }
  return Promise.resolve(Buffer.from(data as ArrayBuffer));
}

function publicUrl(bucket: string, path: string): string {
  return `${getAppUrl()}/api/files/${bucket}/${path}`;
}

class StorageBucket {
  constructor(private bucket: string) {}

  async upload(
    path: string,
    file: Blob | ArrayBuffer | Buffer | File | Uint8Array,
    options?: { contentType?: string; upsert?: boolean }
  ) {
    try {
      const sql = getSql();
      const buffer = await toBuffer(file);
      const bucketConfig = BUCKETS.find((b) => b.id === this.bucket);
      const isPublic = bucketConfig?.public ?? false;

      if (options?.upsert) {
        await sql`
          DELETE FROM stored_files WHERE bucket = ${this.bucket} AND path = ${path}
        `;
      }

      await sql`
        INSERT INTO stored_files (bucket, path, content_type, data, is_public)
        VALUES (${this.bucket}, ${path}, ${options?.contentType ?? null}, ${buffer}, ${isPublic})
        ON CONFLICT (bucket, path) DO UPDATE SET
          content_type = EXCLUDED.content_type,
          data = EXCLUDED.data,
          is_public = EXCLUDED.is_public
      `;

      return { data: { path }, error: null };
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : "Upload failed" } };
    }
  }

  getPublicUrl(path: string) {
    return { data: { publicUrl: publicUrl(this.bucket, path) } };
  }

  async download(path: string) {
    try {
      const sql = getSql();
      const rows = await sql`
        SELECT content_type, data FROM stored_files
        WHERE bucket = ${this.bucket} AND path = ${path}
        LIMIT 1
      `;
      if (!rows.length) {
        return { data: null, error: { message: "File not found" } };
      }
      const row = rows[0] as { content_type: string | null; data: Buffer };
      const blob = new Blob([row.data], { type: row.content_type ?? "application/octet-stream" });
      return {
        data: blob,
        error: null,
        contentType: row.content_type,
      };
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : "Download failed" } };
    }
  }
}

export const storage = {
  async listBuckets() {
    return { data: BUCKETS.map((b) => ({ id: b.id, name: b.id, public: b.public })), error: null };
  },

  async createBucket(id: string, options?: { public?: boolean }) {
    const exists = BUCKETS.some((b) => b.id === id);
    if (!exists) {
      BUCKETS.push({ id, public: options?.public ?? false });
    }
    return { data: { id }, error: null };
  },

  from(bucket: string) {
    return new StorageBucket(bucket);
  },
};
