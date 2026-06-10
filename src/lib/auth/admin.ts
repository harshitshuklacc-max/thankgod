import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_SESSION_COOKIE = "shoe_mafia_admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "fallback-dev-secret-change-me";
}

export function createAdminSessionToken(username: string): string {
  const expires = Date.now() + SESSION_DURATION;
  const payload = `${username}:${expires}`;
  const signature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64");
}

export function verifyAdminSessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;

    const [username, expiresStr, signature] = parts;
    const expires = parseInt(expiresStr, 10);

    if (Date.now() > expires) return null;

    const payload = `${username}:${expiresStr}`;
    const expectedSignature = createHmac("sha256", getSessionSecret())
      .update(payload)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    return username;
  } catch {
    return null;
  }
}

export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) return false;

  const usernameMatch =
    username.length === adminUsername.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(adminUsername));

  const passwordMatch =
    password.length === adminPassword.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));

  return usernameMatch && passwordMatch;
}

export async function setAdminSession(username: string) {
  const token = createAdminSessionToken(username);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}
