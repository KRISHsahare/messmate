type DbErrorLike =
  | { message?: string | null; code?: string | null }
  | null
  | undefined;

/**
 * Turns Postgres/PostgREST failures into sentences a student can act on.
 * The database raises its own messages for rate limits and RLS denials.
 */
export function friendlyDbError(
  error: DbErrorLike,
  fallback = "Something went wrong on our side. Please try again.",
): string {
  const message = error?.message ?? "";
  const code = error?.code ?? "";

  if (code === "P0001" || /slow down|rate limit|too many/i.test(message)) {
    return "That's a lot at once — give it a moment and try again.";
  }
  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return "Your account can't do that. If this looks wrong, ask your mess admin.";
  }
  if (code === "23505" || /duplicate key/i.test(message)) {
    return "That was already saved — no need to send it twice.";
  }
  if (code === "23514" || /violates check constraint/i.test(message)) {
    return "That entry doesn't look right. Check it and try again.";
  }
  if (code === "23503" || /foreign key/i.test(message)) {
    return "That meal is no longer on the menu. Refresh to see the latest.";
  }
  if (/failed to fetch|network|timeout/i.test(message)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  return fallback;
}
