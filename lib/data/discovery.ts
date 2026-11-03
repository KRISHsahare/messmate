import { MEAL_ORDER, istDateISO } from "@/lib/meals";
import type { MealType, Mess } from "@/lib/database.types";
import { createAnonClient } from "@/lib/supabase/anon";

/**
 * Read layer for the public mess directory.
 *
 * Everything here is deliberately anonymous: messes and menus are public rows,
 * while ratings and comments only arrive back as aggregates or masked reviews
 * from the security-definer functions in 0003_admin_multimess.sql. Raw
 * `ratings` and `feedback` rows never reach an anonymous visitor.
 */

export type MessStats = {
  averageStars: number | null;
  ratingCount: number;
  commentCount: number;
  mealCount: number;
};

export type TodayMeal = {
  mealType: MealType;
  items: string[];
};

export type MessSummary = Mess & {
  stats: MessStats;
  today: TodayMeal[];
};

export type DirectorySort = "rating" | "price" | "name";

export type DirectoryResult = {
  messes: MessSummary[];
  /** True when the directory is empty because Supabase is not configured. */
  unavailable: boolean;
};

const EMPTY_STATS: MessStats = {
  averageStars: null,
  ratingCount: 0,
  commentCount: 0,
  mealCount: 0,
};

const MAX_DIRECTORY_MESSES = 100;

/** Directory listing with search, sort and today's menu in one round trip set. */
export async function listMessDirectory(options: {
  search?: string;
  sort?: DirectorySort;
}): Promise<DirectoryResult> {
  let supabase: ReturnType<typeof createAnonClient>;
  try {
    supabase = createAnonClient();
  } catch {
    return { messes: [], unavailable: true };
  }
  const today = istDateISO();
  const sort = options.sort ?? "rating";
  const search = (options.search ?? "").trim().toLowerCase();

  const { data: allMessRows, error } = await supabase
    .from("messes")
    .select("id, name, location, address, price_per_meal, created_at")
    .order("name", { ascending: true })
    .limit(MAX_DIRECTORY_MESSES);

  if (error || !allMessRows) {
    return { messes: [], unavailable: true };
  }

  // Filtered here rather than with PostgREST `.or()` so a stray comma or
  // parenthesis in the search box can never rewrite the filter expression.
  const messRows = search
    ? allMessRows.filter(
        (mess) =>
          mess.name.toLowerCase().includes(search) ||
          (mess.location ?? "").toLowerCase().includes(search),
      )
    : allMessRows;

  const messIds = messRows.map((mess) => mess.id);
  if (messIds.length === 0) return { messes: [], unavailable: false };

  const [statsResult, todayResult] = await Promise.all([
    supabase.rpc("mess_directory_stats", { p_mess_ids: messIds }),
    supabase
      .from("menus")
      .select("mess_id, meal_type, items")
      .in("mess_id", messIds)
      .eq("date", today),
  ]);

  const statsByMess = new Map<string, MessStats>();
  for (const row of statsResult.data ?? []) {
    statsByMess.set(row.mess_id, {
      averageStars: row.avg_stars === null ? null : Number(row.avg_stars),
      ratingCount: Number(row.rating_count),
      commentCount: Number(row.comment_count),
      mealCount: Number(row.meal_count),
    });
  }

  const todayByMess = new Map<string, TodayMeal[]>();
  for (const row of todayResult.data ?? []) {
    const list = todayByMess.get(row.mess_id) ?? [];
    list.push({ mealType: row.meal_type, items: row.items });
    todayByMess.set(row.mess_id, list);
  }

  const messes: MessSummary[] = messRows.map((mess) => ({
    ...mess,
    stats: statsByMess.get(mess.id) ?? EMPTY_STATS,
    today: MEAL_ORDER.map((mealType) => ({
      mealType,
      items:
        todayByMess
          .get(mess.id)
          ?.find((meal) => meal.mealType === mealType)?.items ?? [],
    })).filter((meal) => meal.items.length > 0),
  }));

  return { messes: sortMesses(messes, sort), unavailable: false };
}

/**
 * Rating sort needs the last 30 days; price and name sort in Postgres so the
 * directory stays correct past the first page.
 */
function sortMesses(messes: MessSummary[], sort: DirectorySort): MessSummary[] {
  const copy = [...messes];

  if (sort === "price") {
    return copy.sort(
      (a, b) =>
        (a.price_per_meal ?? Number.POSITIVE_INFINITY) -
        (b.price_per_meal ?? Number.POSITIVE_INFINITY),
    );
  }

  if (sort === "name") return copy.sort((a, b) => a.name.localeCompare(b.name));

  return copy.sort((a, b) => {
    const left = a.stats.averageStars ?? -1;
    const right = b.stats.averageStars ?? -1;
    if (right !== left) return right - left;
    return a.name.localeCompare(b.name);
  });
}

export type RatingBucket = {
  mealType: MealType;
  averageStars: number | null;
  ratingCount: number;
  distribution: { stars: 1 | 2 | 3 | 4 | 5; count: number }[];
};

export type PublicReview = {
  createdAt: string;
  stars: number | null;
  comment: string;
  mealType: MealType;
  menuDate: string;
  authorLabel: string;
};

export type MessDetail = {
  mess: Mess;
  stats: MessStats;
  today: TodayMeal[];
  breakdown: RatingBucket[];
  reviews: PublicReview[];
};

export type MessDetailResult =
  | { status: "ok"; detail: MessDetail }
  | { status: "not-found" }
  | { status: "error" };

/** Everything /messes/[id] shows, plus the mess record for the page header. */
export async function getMessDetail(messId: string): Promise<MessDetailResult> {
  let supabase: ReturnType<typeof createAnonClient>;
  try {
    supabase = createAnonClient();
  } catch {
    return { status: "error" };
  }
  const today = istDateISO();

  const { data: mess, error: messError } = await supabase
    .from("messes")
    .select("id, name, location, address, price_per_meal, created_at")
    .eq("id", messId)
    .maybeSingle();

  if (messError || !mess) return { status: "not-found" };

  const [statsResult, menusResult, breakdownResult, reviewsResult] =
    await Promise.all([
      supabase.rpc("mess_directory_stats", { p_mess_ids: [mess.id] }),
      supabase
        .from("menus")
        .select("meal_type, items, date")
        .eq("mess_id", mess.id)
        .eq("date", today),
      supabase.rpc("mess_rating_breakdown", { p_mess_id: mess.id }),
      supabase.rpc("mess_recent_reviews", { p_mess_id: mess.id, p_limit: 6 }),
    ]);

  const stats = (statsResult.data ?? [])[0];
  const eaten = menusResult.data ?? [];

  return {
    status: "ok",
    detail: {
      mess,
      stats: {
        averageStars: stats?.avg_stars == null ? null : Number(stats.avg_stars),
        ratingCount: Number(stats?.rating_count ?? 0),
        commentCount: Number(stats?.comment_count ?? 0),
        mealCount: Number(stats?.meal_count ?? 0),
      },
      today: MEAL_ORDER.map((mealType) => ({
        mealType,
        items: eaten.find((row) => row.meal_type === mealType)?.items ?? [],
      })).filter((meal) => meal.items.length > 0),
      breakdown: (breakdownResult.data ?? []).map((row) => ({
        mealType: row.meal_type,
        averageStars: row.avg_stars == null ? null : Number(row.avg_stars),
        ratingCount: Number(row.rating_count),
        distribution: [
          { stars: 1 as const, count: Number(row.one_star) },
          { stars: 2 as const, count: Number(row.two_star) },
          { stars: 3 as const, count: Number(row.three_star) },
          { stars: 4 as const, count: Number(row.four_star) },
          { stars: 5 as const, count: Number(row.five_star) },
        ],
      })),
      reviews: (reviewsResult.data ?? []).map((row) => ({
        createdAt: row.created_at,
        stars: row.stars,
        comment: row.comment,
        mealType: row.meal_type,
        menuDate: row.menu_date,
        authorLabel: row.author_label,
      })),
    },
  };
}

/** Side-by-side comparison for /messes/compare. */
export async function getMessComparison(
  messIds: string[],
): Promise<MessSummary[]> {
  const unique = [...new Set(messIds)].slice(0, 3);
  if (unique.length === 0) return [];

  const { messes } = await listMessDirectory({ sort: "name" });
  return unique
    .map((id) => messes.find((mess) => mess.id === id))
    .filter((mess): mess is MessSummary => Boolean(mess));
}
