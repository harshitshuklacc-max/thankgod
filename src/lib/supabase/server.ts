import { createServerClient } from "@/lib/db/server-client";

export async function createClient() {
  return createServerClient();
}
