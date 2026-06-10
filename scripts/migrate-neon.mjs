import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load env from every common file name (Next.js uses .env.local)
for (const file of [".env.local", ".env", "local.env", ".env.env", "vercel.env"]) {
  const path = join(root, file);
  if (existsSync(path)) {
    dotenv.config({ path, override: false });
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  console.error("DATABASE_URL is required.");
  console.error("Create .env.local in the project root with your Neon connection string.");
  process.exit(1);
}

const schemaPath = join(root, "neon", "schema.sql");
const sql = readFileSync(schemaPath, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Neon schema migrated successfully");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
