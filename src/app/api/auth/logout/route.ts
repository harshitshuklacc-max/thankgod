import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/db/auth";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
