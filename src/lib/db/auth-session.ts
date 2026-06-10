import "server-only";

import { cookies } from "next/headers";

import { verifySessionToken } from "./auth-core";
import { CUSTOMER_SESSION_COOKIE, type AuthUser } from "./auth-types";

export { CUSTOMER_SESSION_COOKIE, type AuthUser } from "./auth-types";
export {
  createSessionToken,
  signInWithPassword,
  signUpWithPassword,
  verifySessionToken,
} from "./auth-core";

export async function getUserFromCookies(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}
