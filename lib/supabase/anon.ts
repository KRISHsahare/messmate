import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Session-less Supabase client for the public discovery pages.
 *
 * These routes are readable without logging in, so there is no cookie jar to
 * read. Row-level security still applies: `messes` and `menus` are public,
 * everything else only arrives through the aggregate functions in
 * supabase/migrations/0003_admin_multimess.sql.
 */
export function createAnonClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
