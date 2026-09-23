import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cookie-less client for public, cacheable reads (RLS applies as the `anon` role).
// Returns null until Supabase env vars are configured, so pages can render empty states.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
