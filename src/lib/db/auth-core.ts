import "server-only";

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

import { getSql } from "./neon";
import type { AuthUser } from "./auth-types";

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "dev-customer-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    metadata: user.user_metadata ?? {},
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (!payload.sub || !payload.email) return null;
    return {
      id: String(payload.sub),
      email: String(payload.email),
      user_metadata: (payload.metadata as Record<string, unknown>) ?? {},
    };
  } catch {
    return null;
  }
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}): Promise<{ user: AuthUser | null; error: { message: string } | null }> {
  const sql = getSql();
  const email = input.email.trim().toLowerCase();

  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length) {
    return { user: null, error: { message: "User already registered" } };
  }

  const passwordHash = await hashPassword(input.password);
  const users = await sql`
    INSERT INTO users (email, password_hash, email_verified)
    VALUES (${email}, ${passwordHash}, true)
    RETURNING id, email
  `;

  const user = users[0] as { id: string; email: string };
  await sql`
    INSERT INTO customers (id, full_name, phone)
    VALUES (
      ${user.id}::uuid,
      ${String(input.metadata?.full_name ?? "")},
      ${String(input.metadata?.phone ?? "")}
    )
    ON CONFLICT (id) DO NOTHING
  `;

  return {
    user: { id: user.id, email: user.email, user_metadata: input.metadata ?? {} },
    error: null,
  };
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser | null; error: { message: string } | null }> {
  const sql = getSql();
  const email = input.email.trim().toLowerCase();

  const rows = await sql`
    SELECT u.id, u.email, u.password_hash, c.full_name, c.phone
    FROM users u
    LEFT JOIN customers c ON c.id = u.id
    WHERE u.email = ${email}
    LIMIT 1
  `;

  if (!rows.length) {
    return { user: null, error: { message: "Invalid login credentials" } };
  }

  const row = rows[0] as {
    id: string;
    email: string;
    password_hash: string;
    full_name: string | null;
    phone: string | null;
  };

  const valid = await verifyPassword(input.password, row.password_hash);
  if (!valid) {
    return { user: null, error: { message: "Invalid login credentials" } };
  }

  return {
    user: {
      id: row.id,
      email: row.email,
      user_metadata: { full_name: row.full_name, phone: row.phone },
    },
    error: null,
  };
}
