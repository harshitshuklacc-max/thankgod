import { NextResponse } from "next/server";

import { createSessionToken, setSessionCookie, signUpWithPassword } from "@/lib/db/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { user, error } = await signUpWithPassword({
    email: body.email,
    password: body.password,
    metadata: body.metadata,
  });

  if (error || !user) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const token = await createSessionToken(user);
  await setSessionCookie(token);
  return NextResponse.json({ user });
}
