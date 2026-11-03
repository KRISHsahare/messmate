import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import type { Profile, UserRole } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

/** Where each role lands after login. */
export function homeForRole(role: UserRole | null | undefined) {
  return role === "admin" ? "/admin" : "/menu";
}

export type Session = {
  user: User;
  profile: Profile | null;
};

/**
 * Reads the current user and profile once per request.
 * RLS guarantees a student can only read their own profile row.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role, mess_id, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
});

/** Session with a guaranteed profile, or a safe student fallback. */
export function profileOrDefaults(session: Session): Profile {
  if (session.profile) return session.profile;

  const fallbackName =
    session.user.email?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "Student";

  return {
    id: session.user.id,
    name: fallbackName,
    role: "student",
    mess_id: null,
    created_at: new Date(0).toISOString(),
  };
}
