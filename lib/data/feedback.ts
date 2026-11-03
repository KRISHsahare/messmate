import { getSession } from "@/lib/auth";
import type { MealType } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type FeedbackEntry = {
  id: string;
  comment: string;
  createdAt: string;
  menuDate: string | null;
  mealType: MealType | null;
  stars: number | null;
};

export type MyFeedbackResult =
  | { status: "ok"; entries: FeedbackEntry[] }
  | { status: "error"; message: string };

const MAX_ENTRIES = 60;

/**
 * The student's own comments, newest first. RLS already limits this to their
 * rows; the explicit user filter keeps the intent readable.
 */
export async function listMyFeedback(): Promise<MyFeedbackResult> {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "Your session expired. Please log in again." };
  }

  const supabase = await createClient();

  const { data: feedbackRows, error } = await supabase
    .from("feedback")
    .select("id, menu_id, comment, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_ENTRIES);

  if (error) {
    return {
      status: "error",
      message: "We couldn't load your feedback. Please refresh and try again.",
    };
  }

  const rows = feedbackRows ?? [];
  if (rows.length === 0) return { status: "ok", entries: [] };

  const menuIds = [...new Set(rows.map((row) => row.menu_id))];

  const [menusResult, ratingsResult] = await Promise.all([
    supabase.from("menus").select("id, date, meal_type").in("id", menuIds),
    supabase
      .from("ratings")
      .select("menu_id, stars")
      .eq("user_id", session.user.id)
      .in("menu_id", menuIds),
  ]);

  const menus = new Map((menusResult.data ?? []).map((menu) => [menu.id, menu]));
  const ratings = new Map(
    (ratingsResult.data ?? []).map((rating) => [rating.menu_id, rating.stars]),
  );

  return {
    status: "ok",
    entries: rows.map((row) => ({
      id: row.id,
      comment: row.comment,
      createdAt: row.created_at,
      menuDate: menus.get(row.menu_id)?.date ?? null,
      mealType: menus.get(row.menu_id)?.meal_type ?? null,
      stars: ratings.get(row.menu_id) ?? null,
    })),
  };
}
