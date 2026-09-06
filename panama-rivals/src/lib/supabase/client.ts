import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let warned = false;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (!warned) {
      warned = true;
      console.warn(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL/ANON_KEY missing — using localStorage only. " +
          "Registrations/results won't sync across devices until .env.local is configured (see .env.example)."
      );
    }
    return null;
  }
  client = createClient(url, key);
  return client;
}
