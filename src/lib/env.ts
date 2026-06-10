/** Required env vars for admin portal to work on Vercel */
export const ADMIN_REQUIRED_ENV = [
  "DATABASE_URL",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
] as const;

/** Resolve Neon/Vercel Postgres connection string from any supported env var name */
export function getDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }

  return undefined;
}

export function getMissingAdminEnvVars(): string[] {
  const missing: string[] = [];

  if (!getDatabaseUrl()) {
    missing.push("DATABASE_URL");
  }
  if (!process.env.ADMIN_USERNAME?.trim()) {
    missing.push("ADMIN_USERNAME");
  }
  if (!process.env.ADMIN_PASSWORD?.trim()) {
    missing.push("ADMIN_PASSWORD");
  }
  if (!process.env.ADMIN_SESSION_SECRET?.trim()) {
    missing.push("ADMIN_SESSION_SECRET");
  }

  return missing;
}

export function isAdminEnvConfigured(): boolean {
  return getMissingAdminEnvVars().length === 0;
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
