"use server";

import {
  verifyAdminCredentials,
  setAdminSession,
  clearAdminSession,
  getAdminSession,
} from "@/lib/auth/admin";
import { getMissingAdminEnvVars } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getAdminEnvStatus(): Promise<
  ActionResult<{ configured: boolean; missing: string[] }>
> {
  const missing = getMissingAdminEnvVars();
  return {
    success: true,
    data: { configured: missing.length === 0, missing: [...missing] },
  };
}

export async function adminLogin(
  username: string,
  password: string
): Promise<ActionResult<{ username: string }>> {
  try {
    const missing = getMissingAdminEnvVars();
    if (missing.length > 0) {
      return {
        success: false,
        error: `Server not configured. Add these env vars in Vercel: ${missing.join(", ")}`,
      };
    }

    if (!verifyAdminCredentials(username, password)) {
      return { success: false, error: "Invalid username or password" };
    }

    await setAdminSession(username);

    try {
      const supabase = createAdminClient();
      await supabase
        .from("admins")
        .upsert({ username, last_login: new Date().toISOString() }, { onConflict: "username" });
    } catch {
      // Login still works if admins table upsert fails
    }

    return { success: true, data: { username } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return { success: false, error: message };
  }
}

export async function adminLogout(): Promise<ActionResult> {
  try {
    await clearAdminSession();
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Logout failed";
    return { success: false, error: message };
  }
}

export async function verifyAdminPassword(
  password: string
): Promise<ActionResult<{ verified: boolean }>> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return { success: false, error: "Admin password not configured" };
    }

    const verified =
      password.length === adminPassword.length &&
      timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));

    if (!verified) {
      return { success: false, error: "Invalid password" };
    }

    return { success: true, data: { verified: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return { success: false, error: message };
  }
}
