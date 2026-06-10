import { createServerClient } from "@/lib/db/server-client";

export function createAdminClient() {
  return createServerClient();
}
