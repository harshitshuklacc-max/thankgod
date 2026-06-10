import { SettingsForm } from "@/components/admin/settings-form";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Setting } from "@/types/database";

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("settings").select("*").order("key");

  const settings = (data ?? []) as Setting[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-zinc-400">Configure your store preferences</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
