import { NextResponse } from "next/server";

import { getUserFromCookies } from "@/lib/db/auth";

export async function GET() {
  const user = await getUserFromCookies();
  return NextResponse.json({ user });
}
