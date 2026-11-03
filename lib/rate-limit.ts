import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type LimitedTable = "ratings" | "feedback" | "reports";
type LimitKind = "rating" | "feedback" | "report";

type Limit = {
  table: LimitedTable;
  max: number;
  windowMs: number;
  message: string;
};

/**
 * Per-user submission limits. The numbers mirror the trigger in
 * supabase/migrations/0002_student_modules.sql — this check exists to give a
 * friendly message before the write, while the trigger is the real guard.
 */
export const RATE_LIMITS: Record<LimitKind, Limit> = {
  rating: {
    table: "ratings",
    max: 25,
    windowMs: 10 * 60_000,
    message:
      "You've rated a lot in the last few minutes. Take a breather and try again shortly.",
  },
  feedback: {
    table: "feedback",
    max: 5,
    windowMs: 10 * 60_000,
    message:
      "You've sent several comments just now. Please wait a few minutes before sending another.",
  },
  report: {
    table: "reports",
    max: 3,
    windowMs: 60 * 60_000,
    message:
      "You've filed 3 reports in the last hour. If it's urgent, speak to the mess secretary directly.",
  },
};

/**
 * Returns a friendly message when the student is over the limit, or null when
 * they may proceed. A failed count never blocks the write (the DB trigger does).
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  kind: LimitKind,
  userId: string,
): Promise<string | null> {
  const limit = RATE_LIMITS[kind];
  const since = new Date(Date.now() - limit.windowMs).toISOString();

  const { count, error } = await supabase
    .from(limit.table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) return null;

  return (count ?? 0) >= limit.max ? limit.message : null;
}
