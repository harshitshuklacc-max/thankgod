import "server-only";

import { neon, neonConfig } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/env";

neonConfig.fetchConnectionCache = true;

export function getSql() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to .env.local (local) or Vercel Environment Variables (production)."
    );
  }
  return neon(url);
}
