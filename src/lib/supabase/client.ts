import { createBrowserClient } from "@/lib/db/browser-client";

export function createClient() {
  return createBrowserClient();
}
