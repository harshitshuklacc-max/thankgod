import { NextResponse } from "next/server";

import { createSessionToken, setSessionCookie, signInWithPassword } from "@/lib/db/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { user, error } = await signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const token = await createSessionToken(user);
  await setSessionCookie(token);
  return NextResponse.json({ user });
}
