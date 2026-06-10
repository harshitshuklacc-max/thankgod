import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "shoe_mafia_admin_session";

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "fallback-dev-secret-change-me";
}

async function verifyAdminSessionTokenEdge(token: string): Promise<string | null> {
  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;

    const [username, expiresStr, signature] = parts;
    const expires = parseInt(expiresStr, 10);

    if (Date.now() > expires) return null;

    const payload = `${username}:${expiresStr}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(getSessionSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature.length !== expectedSignature.length) return null;

    let match = true;
    for (let i = 0; i < signature.length; i++) {
      if (signature[i] !== expectedSignature[i]) match = false;
    }
    if (!match) return null;

    return username;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (token) {
      const username = await verifyAdminSessionTokenEdge(token);
      if (username) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const username = await verifyAdminSessionTokenEdge(token);
  if (!username) {
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete(ADMIN_SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
