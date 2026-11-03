import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Server Supabase client for Server Components, Server Actions and Route Handlers.
 * Sessions live in httpOnly cookies, so every request re-creates the client.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component: cookies are read-only here.
          // The Proxy refreshes the session, so this can be safely ignored.
        }
      },
    },
  });
}
