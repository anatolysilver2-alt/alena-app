import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !key && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Supabase is not configured. Missing: ${missing}. Add them in .env.local (local) or Vercel → Settings → Environment Variables.`,
    );
  }

  return { url, key };
}

let client: SupabaseClient | null = null;

/** Lazy singleton so env vars are read at request time, not at stale build time. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const { url, key } = readSupabaseEnv();
    client = createClient(url, key);
  }
  return client;
}
