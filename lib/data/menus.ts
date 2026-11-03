import { getSession, profileOrDefaults } from "@/lib/auth";
import type { MealType } from "@/lib/database.types";
import { MEAL_ORDER, istDateISO } from "@/lib/meals";
import { createClient } from "@/lib/supabase/server";

export type MealComment = {
  id: string;
  comment: string;
  createdAt: string;
};

export type MealEntry = {
  mealType: MealType;
  /** null when the mess has not published this meal yet. */
  menuId: string | null;
  items: string[];
  averageStars: number | null;
  ratingCount: number;
  myStars: number | null;
  myComments: MealComment[];
};

export type DayMenu = {
  date: string;
  messName: string | null;
  meals: MealEntry[];
};

export type DayMenuResult =
  | { status: "ok"; day: DayMenu }
  | { status: "no-mess" }
  | { status: "error"; message: string };

type RatingSummaryRow = {
  menu_id: string;
  avg_stars: number;
  rating_count: number;
};

/**
 * Loads one day of menus for the signed-in student together with the crowd
 * average (via the security-definer RPC), their own rating and their comments.
 */
export async function getDayMenu(offsetDays: number): Promise<DayMenuResult> {
  const session = await getSession();

  if (!session) {
    return { status: "error", message: "Your session expired. Please log in again." };
  }

  const profile = profileOrDefaults(session);

  if (!profile.mess_id) {
    return { status: "no-mess" };
  }

  const supabase = await createClient();
  const date = istDateISO(offsetDays);

  const { data: menuRows, error: menuError } = await supabase
    .from("menus")
    .select("id, meal_type, items")
    .eq("mess_id", profile.mess_id)
    .eq("date", date);

  if (menuError) {
    return {
      status: "error",
      message: "We couldn't load the menu just now. Please try again.",
    };
  }

  const menus = menuRows ?? [];
  const menuIds = menus.map((menu) => menu.id);

  const [summaryResult, myRatingsResult, myCommentsResult, messResult] =
    await Promise.all([
      menuIds.length
        ? supabase.rpc("meal_rating_summary", { menu_ids: menuIds })
        : Promise.resolve({ data: [] as RatingSummaryRow[], error: null }),
      menuIds.length
        ? supabase
            .from("ratings")
            .select("menu_id, stars")
            .eq("user_id", profile.id)
            .in("menu_id", menuIds)
        : Promise.resolve({ data: [] as { menu_id: string; stars: number }[], error: null }),
      menuIds.length
        ? supabase
            .from("feedback")
            .select("id, menu_id, comment, created_at")
            .eq("user_id", profile.id)
            .in("menu_id", menuIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({
            data: [] as {
              id: string;
              menu_id: string;
              comment: string;
              created_at: string;
            }[],
            error: null,
          }),
      supabase.from("messes").select("name").eq("id", profile.mess_id).maybeSingle(),
    ]);

  const summaries = new Map<string, RatingSummaryRow>();
  for (const row of (summaryResult.data ?? []) as RatingSummaryRow[]) {
    summaries.set(row.menu_id, row);
  }

  const myRatings = new Map<string, number>();
  for (const row of myRatingsResult.data ?? []) {
    myRatings.set(row.menu_id, row.stars);
  }

  const commentsByMenu = new Map<string, MealComment[]>();
  for (const row of myCommentsResult.data ?? []) {
    const list = commentsByMenu.get(row.menu_id) ?? [];
    list.push({
      id: row.id,
      comment: row.comment,
      createdAt: row.created_at,
    });
    commentsByMenu.set(row.menu_id, list);
  }

  const meals: MealEntry[] = MEAL_ORDER.map((mealType) => {
    const menu = menus.find((row) => row.meal_type === mealType);
    const summary = menu ? summaries.get(menu.id) : undefined;

    return {
      mealType,
      menuId: menu?.id ?? null,
      items: menu?.items ?? [],
      averageStars: summary?.avg_stars ?? null,
      ratingCount: summary?.rating_count ?? 0,
      myStars: menu ? (myRatings.get(menu.id) ?? null) : null,
      myComments: menu ? (commentsByMenu.get(menu.id) ?? []) : [],
    };
  });

  return {
    status: "ok",
    day: {
      date,
      messName: messResult.data?.name ?? null,
      meals,
    },
  };
}
