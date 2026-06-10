"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json, Setting } from "@/types/database";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getSettings(): Promise<ActionResult<Setting[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("key", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Setting[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings";
    return { success: false, error: message };
  }
}

export async function getSetting(key: string): Promise<ActionResult<Setting>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", key)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Setting not found" };
    }

    return { success: true, data: data as Setting };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch setting";
    return { success: false, error: message };
  }
}

export async function updateSetting(
  key: string,
  value: Json
): Promise<ActionResult<Setting>> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("settings")
      .upsert({ key, value }, { onConflict: "key" })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to update setting" };
    }

    return { success: true, data: data as Setting };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update setting";
    return { success: false, error: message };
  }
}
