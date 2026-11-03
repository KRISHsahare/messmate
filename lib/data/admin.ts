import type { SupabaseClient } from "@supabase/supabase-js";

import { profileOrDefaults } from "@/lib/auth";
import type {
  Database,
  MealType,
  ReportCategory,
  ReportStatus,
} from "@/lib/database.types";
import { getSession } from "@/lib/auth";
import { MEAL_ORDER, TREND_DAYS, istDateISO } from "@/lib/meals";
import { createClient } from "@/lib/supabase/server";
import {
  isMealType,
  isReportStatus,
  validateMenuDate,
} from "@/lib/validation";

/**
 * Read layer for the administrator console.
 *
 * Every query here runs with the admin's session, so row-level security is the
 * authority: the `is_admin()` policies in 0001 let an administrator read the
 * ratings, comments and reports of every mess. Nothing in this module is
 * reachable by a student because the pages guard on the profile role too.
 */

const CHUNK = 80;
const FEEDBACK_LIMIT = 400;
const REPORTS_LIMIT = 200;
const ATTENTION_THRESHOLD = 2.5;

type Client = SupabaseClient<Database>;

function chunk<T>(items: T[], size = CHUNK): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function average(sum: number, count: number): number | null {
  if (count === 0) return null;
  return Math.round((sum / count) * 100) / 100;
}

type RatingRow = {
  menu_id: string;
  user_id: string;
  stars: number;
};

/** Ratings for a set of menus, batched so the URL stays a sane length. */
async function fetchRatings(
  supabase: Client,
  menuIds: string[],
): Promise<RatingRow[]> {
  const rows: RatingRow[] = [];

  for (const group of chunk(menuIds)) {
    const { data, error } = await supabase
      .from("ratings")
      .select("menu_id, user_id, stars")
      .in("menu_id", group);

    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/* Dashboard overview                                                         */
/* -------------------------------------------------------------------------- */

export type TrendPoint = {
  date: string;
  label: string;
  breakfast: number | null;
  lunch: number | null;
  dinner: number | null;
};

export type MealComparison = {
  mealType: MealType;
  label: string;
  averageStars: number | null;
  ratingCount: number;
};

export type AttentionMeal = {
  menuId: string;
  messName: string;
  date: string;
  mealType: MealType;
  averageStars: number;
  ratingCount: number;
};

export type AdminOverview = {
  today: number | null;
  todayVotes: number;
  week: number | null;
  month: number | null;
  totalFeedback: number;
  openReports: number;
  inProgressReports: number;
  messCount: number;
  trend: TrendPoint[];
  meals: MealComparison[];
  attention: AttentionMeal[];
};

/** "3 Nov" — compact chart axis label. */
function chartLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient();
  const today = istDateISO();
  const windowStart = istDateISO(-(TREND_DAYS - 1));
  const weekStart = istDateISO(-6);
  /* "This month" is the running calendar month, not another rolling window. */
  const monthStart = `${today.slice(0, 7)}-01`;
  /* The month can begin before the 30-day chart window, so fetch the wider span. */
  const fetchStart = monthStart < windowStart ? monthStart : windowStart;

  const [menusResult, feedbackResult, openResult, progressResult, messesResult] =
    await Promise.all([
      supabase
        .from("menus")
        .select("id, mess_id, date, meal_type")
        .gte("date", fetchStart)
        .lte("date", today),
      supabase.from("feedback").select("id", { count: "exact", head: true }),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress"),
      supabase.from("messes").select("id, name"),
    ]);

  if (menusResult.error) throw new Error(menusResult.error.message);

  const menus = menusResult.data ?? [];
  const ratings = await fetchRatings(
    supabase,
    menus.map((menu) => menu.id),
  );

  const menuById = new Map(menus.map((menu) => [menu.id, menu]));
  const messNameById = new Map(
    (messesResult.data ?? []).map((mess) => [mess.id, mess.name]),
  );

  const perMenu = new Map<string, { sum: number; count: number }>();
  const perDateMeal = new Map<string, { sum: number; count: number }>();
  const perMeal = new Map<MealType, { sum: number; count: number }>();

  let todaySum = 0;
  let todayCount = 0;
  let weekSum = 0;
  let weekCount = 0;
  let monthSum = 0;
  let monthCount = 0;

  for (const rating of ratings) {
    const menu = menuById.get(rating.menu_id);
    if (!menu) continue;

    if (menu.date >= monthStart) {
      monthSum += rating.stars;
      monthCount += 1;
    }

    if (menu.date >= weekStart) {
      weekSum += rating.stars;
      weekCount += 1;
    }

    if (menu.date === today) {
      todaySum += rating.stars;
      todayCount += 1;
    }

    /* Charts stay on the 30-day window even when the month reaches further back. */
    if (menu.date < windowStart) continue;

    const menuBucket = perMenu.get(menu.id) ?? { sum: 0, count: 0 };
    menuBucket.sum += rating.stars;
    menuBucket.count += 1;
    perMenu.set(menu.id, menuBucket);

    const dateKey = `${menu.date}:${menu.meal_type}`;
    const dateBucket = perDateMeal.get(dateKey) ?? { sum: 0, count: 0 };
    dateBucket.sum += rating.stars;
    dateBucket.count += 1;
    perDateMeal.set(dateKey, dateBucket);

    const mealBucket = perMeal.get(menu.meal_type) ?? { sum: 0, count: 0 };
    mealBucket.sum += rating.stars;
    mealBucket.count += 1;
    perMeal.set(menu.meal_type, mealBucket);
  }

  const trend: TrendPoint[] = [];
  for (let offset = -(TREND_DAYS - 1); offset <= 0; offset += 1) {
    const date = istDateISO(offset);
    const point: TrendPoint = {
      date,
      label: chartLabel(date),
      breakfast: null,
      lunch: null,
      dinner: null,
    };

    for (const mealType of MEAL_ORDER) {
      const bucket = perDateMeal.get(`${date}:${mealType}`);
      if (bucket) point[mealType] = average(bucket.sum, bucket.count);
    }

    trend.push(point);
  }

  const meals: MealComparison[] = MEAL_ORDER.map((mealType) => {
    const bucket = perMeal.get(mealType);
    return {
      mealType,
      label: `${mealType[0].toUpperCase()}${mealType.slice(1)}`,
      averageStars: bucket ? average(bucket.sum, bucket.count) : null,
      ratingCount: bucket?.count ?? 0,
    };
  });

  const attention: AttentionMeal[] = [];
  for (const [menuId, bucket] of perMenu) {
    const menu = menuById.get(menuId);
    if (!menu || menu.date < weekStart) continue;

    const avg = average(bucket.sum, bucket.count);
    if (avg === null || avg >= ATTENTION_THRESHOLD) continue;

    attention.push({
      menuId,
      messName: messNameById.get(menu.mess_id) ?? "Mess",
      date: menu.date,
      mealType: menu.meal_type,
      averageStars: avg,
      ratingCount: bucket.count,
    });
  }

  attention.sort((a, b) => {
    if (a.averageStars !== b.averageStars) return a.averageStars - b.averageStars;
    return a.date < b.date ? 1 : -1;
  });

  return {
    today: average(todaySum, todayCount),
    todayVotes: todayCount,
    week: average(weekSum, weekCount),
    month: average(monthSum, monthCount),
    totalFeedback: feedbackResult.count ?? 0,
    openReports: openResult.count ?? 0,
    inProgressReports: progressResult.count ?? 0,
    messCount: messesResult.data?.length ?? 0,
    trend,
    meals,
    attention: attention.slice(0, 6),
  };
}

/* -------------------------------------------------------------------------- */
/* Feedback table                                                             */
/* -------------------------------------------------------------------------- */

export type FeedbackSort = "date" | "stars" | "student";
export type SortDirection = "asc" | "desc";

export type AdminFeedbackRow = {
  id: string;
  comment: string;
  createdAt: string;
  stars: number | null;
  studentName: string;
  mealType: MealType;
  menuDate: string;
  messName: string;
};

export type FeedbackFilters = {
  from?: string;
  to?: string;
  meal?: string;
  order?: string;
};

function isValidFilterDate(value: string | undefined): value is string {
  if (!value) return false;
  const check = validateMenuDate(value);
  return check.ok;
}

export function parseFeedbackFilters(input: FeedbackFilters) {
  const meal = isMealType(input.meal) ? input.meal : "all";
  const [rawSort, rawDirection] = (input.order ?? "date_desc").split("_");
  const sort: FeedbackSort =
    rawSort === "stars" || rawSort === "student" ? rawSort : "date";
  const dir: SortDirection = rawDirection === "asc" ? "asc" : "desc";

  return {
    from: isValidFilterDate(input.from) ? input.from : undefined,
    to: isValidFilterDate(input.to) ? input.to : undefined,
    meal,
    sort,
    dir,
  } as const;
}

export type FeedbackTableResult = {
  rows: AdminFeedbackRow[];
  truncated: boolean;
};

/** Every comment in every mess, with the meal it belongs to and the stars. */
export async function listAllFeedback(
  filters: ReturnType<typeof parseFeedbackFilters>,
): Promise<FeedbackTableResult> {
  const supabase = await createClient();

  const { data: feedbackRows, error } = await supabase
    .from("feedback")
    .select("id, user_id, menu_id, comment, created_at")
    .order("created_at", { ascending: false })
    .limit(FEEDBACK_LIMIT);

  if (error) throw new Error(error.message);

  const rows = feedbackRows ?? [];
  if (rows.length === 0) return { rows: [], truncated: false };

  const menuIds = [...new Set(rows.map((row) => row.menu_id))];
  const userIds = [...new Set(rows.map((row) => row.user_id))];

  const menus: {
    id: string;
    mess_id: string;
    date: string;
    meal_type: MealType;
  }[] = [];
  for (const group of chunk(menuIds)) {
    const { data, error: menuError } = await supabase
      .from("menus")
      .select("id, mess_id, date, meal_type")
      .in("id", group);
    if (menuError) throw new Error(menuError.message);
    menus.push(...(data ?? []));
  }

  const profiles: { id: string; name: string }[] = [];
  for (const group of chunk(userIds)) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", group);
    if (profileError) throw new Error(profileError.message);
    profiles.push(...(data ?? []));
  }

  const messIds = [...new Set(menus.map((menu) => menu.mess_id))];
  const messes: { id: string; name: string }[] = [];
  for (const group of chunk(messIds)) {
    const { data, error: messError } = await supabase
      .from("messes")
      .select("id, name")
      .in("id", group);
    if (messError) throw new Error(messError.message);
    messes.push(...(data ?? []));
  }

  const ratings = await fetchRatings(supabase, menuIds);

  const menuById = new Map(menus.map((menu) => [menu.id, menu]));
  const nameById = new Map(profiles.map((profile) => [profile.id, profile.name]));
  const messNameById = new Map(messes.map((mess) => [mess.id, mess.name]));
  const starsByPair = new Map(
    ratings.map((rating) => [`${rating.user_id}:${rating.menu_id}`, rating.stars]),
  );

  const mapped: AdminFeedbackRow[] = rows.flatMap((row) => {
    const menu = menuById.get(row.menu_id);
    if (!menu) return [];

    return [
      {
        id: row.id,
        comment: row.comment,
        createdAt: row.created_at,
        stars: starsByPair.get(`${row.user_id}:${row.menu_id}`) ?? null,
        studentName: nameById.get(row.user_id) ?? "Student",
        mealType: menu.meal_type,
        menuDate: menu.date,
        messName: messNameById.get(menu.mess_id) ?? "Mess",
      },
    ];
  });

  const filtered = mapped.filter((row) => {
    if (filters.meal !== "all" && row.mealType !== filters.meal) return false;
    if (filters.from && row.menuDate < filters.from) return false;
    if (filters.to && row.menuDate > filters.to) return false;
    return true;
  });

  const direction = filters.dir === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    if (filters.sort === "student") {
      return a.studentName.localeCompare(b.studentName) * direction;
    }
    if (filters.sort === "stars") {
      const left = a.stars ?? -1;
      const right = b.stars ?? -1;
      if (left !== right) return (left - right) * direction;
      return a.menuDate < b.menuDate ? 1 : -1;
    }
    if (a.menuDate !== b.menuDate) {
      return (a.menuDate < b.menuDate ? -1 : 1) * direction;
    }
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  return { rows: filtered, truncated: rows.length === FEEDBACK_LIMIT };
}

/* -------------------------------------------------------------------------- */
/* Reports inbox                                                              */
/* -------------------------------------------------------------------------- */

export type AdminReportRow = {
  id: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  createdAt: string;
  studentName: string;
  messName: string;
};

export type ReportFilters = {
  status?: string;
  category?: string;
};

export function parseReportFilters(input: ReportFilters) {
  return {
    status: isReportStatus(input.status) ? input.status : "all",
    category: input.category ?? "all",
  } as const;
}

export async function listAllReports(
  filters: ReturnType<typeof parseReportFilters>,
): Promise<AdminReportRow[]> {
  const supabase = await createClient();

  const { data: reports, error } = await supabase
    .from("reports")
    .select("id, user_id, mess_id, category, description, status, created_at")
    .order("created_at", { ascending: false })
    .limit(REPORTS_LIMIT);

  if (error) throw new Error(error.message);
  if (!reports || reports.length === 0) return [];

  const userIds = [...new Set(reports.map((report) => report.user_id))];
  const messIds = [...new Set(reports.map((report) => report.mess_id))];

  const [profileResult, messResult] = await Promise.all([
    supabase.from("profiles").select("id, name").in("id", userIds),
    supabase.from("messes").select("id, name").in("id", messIds),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);
  if (messResult.error) throw new Error(messResult.error.message);

  const nameById = new Map(
    (profileResult.data ?? []).map((profile) => [profile.id, profile.name]),
  );
  const messNameById = new Map(
    (messResult.data ?? []).map((mess) => [mess.id, mess.name]),
  );

  return reports
    .filter((report) => {
      if (filters.status !== "all" && report.status !== filters.status) return false;
      if (filters.category !== "all" && report.category !== filters.category) {
        return false;
      }
      return true;
    })
    .map((report) => ({
      id: report.id,
      category: report.category,
      description: report.description,
      status: report.status,
      createdAt: report.created_at,
      studentName: nameById.get(report.user_id) ?? "Student",
      messName: messNameById.get(report.mess_id) ?? "Mess",
    }));
}

/* -------------------------------------------------------------------------- */
/* Menu manager                                                               */
/* -------------------------------------------------------------------------- */

export type AdminMess = {
  id: string | null;
  name: string;
  pricePerMeal: number | null;
};

/** The mess whose menu the signed-in administrator manages. */
export async function getAdminMess(): Promise<AdminMess> {
  const session = await getSession();
  if (!session) return { id: null, name: "Your mess", pricePerMeal: null };

  const profile = profileOrDefaults(session);
  if (!profile.mess_id) return { id: null, name: "Your mess", pricePerMeal: null };

  const supabase = await createClient();
  const { data } = await supabase
    .from("messes")
    .select("id, name, price_per_meal")
    .eq("id", profile.mess_id)
    .maybeSingle();

  return {
    id: profile.mess_id,
    name: data?.name ?? "Your mess",
    pricePerMeal:
      data?.price_per_meal === null || data?.price_per_meal === undefined
        ? null
        : Number(data.price_per_meal),
  };
}

export type MenuEditorMeal = {
  mealType: MealType;
  menuId: string | null;
  items: string[];
};

export type MenuEditorDay = {
  mess: AdminMess;
  date: string;
  meals: MenuEditorMeal[];
};

export async function getMenuEditorDay(date: string): Promise<MenuEditorDay> {
  const mess = await getAdminMess();
  const meals: MenuEditorMeal[] = MEAL_ORDER.map((mealType) => ({
    mealType,
    menuId: null,
    items: [],
  }));

  if (!mess.id) return { mess, date, meals };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menus")
    .select("id, meal_type, items")
    .eq("mess_id", mess.id)
    .eq("date", date);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const meal = meals.find((entry) => entry.mealType === row.meal_type);
    if (!meal) continue;
    meal.menuId = row.id;
    meal.items = row.items;
  }

  return { mess, date, meals };
}

/** Number of published meals in the next seven days, for the manager header. */
export async function countUpcomingMenus(messId: string | null): Promise<number> {
  if (!messId) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("menus")
    .select("id", { count: "exact", head: true })
    .eq("mess_id", messId)
    .gte("date", istDateISO())
    .lte("date", istDateISO(6));

  return count ?? 0;
}

