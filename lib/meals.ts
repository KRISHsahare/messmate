import type { MealType } from "@/lib/database.types";

/**
 * Meal presentation helpers. Menus are stored per calendar day in India, so all
 * date maths happens in Asia/Kolkata rather than the visitor's timezone.
 */
export const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner"];

export const MEAL_META: Record<
  MealType,
  { label: string; emoji: string; window: string }
> = {
  breakfast: { label: "Breakfast", emoji: "🥣", window: "7:30 – 9:30 am" },
  lunch: { label: "Lunch", emoji: "🍛", window: "12:30 – 2:30 pm" },
  dinner: { label: "Dinner", emoji: "🌙", window: "7:30 – 9:30 pm" },
};

/** Days the menu page can show. Anything else falls back to today. */
export const DAY_OFFSETS = [-1, 0, 1] as const;
export type DayOffset = (typeof DAY_OFFSETS)[number];

/** Window behind today that `npm run seed` publishes menus and ratings for. */
export const TREND_DAYS = 30;

const IST = "Asia/Kolkata";

/** Today's date in India (YYYY-MM-DD), optionally shifted by whole days. */
export function istDateISO(offsetDays = 0): string {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (!offsetDays) return today;

  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offsetDays))
    .toISOString()
    .slice(0, 10);
}

/** "Mon, 3 Nov" for a YYYY-MM-DD menu date. */
export function formatMenuDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

/** "Today", "Yesterday", "Tomorrow" — or the formatted date for anything else. */
export function dayOffsetLabel(offset: number, iso?: string): string {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";
  return iso ? formatMenuDate(iso) : "Menu";
}

/** "3 Nov, 8:42 pm" in Indian time, used on feedback and report history. */
export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: IST,
  }).format(new Date(iso));
}

/** Compact "4.3" style average; null when nobody has rated yet. */
export function formatAverage(average: number | null): string | null {
  if (average === null || Number.isNaN(average)) return null;
  return average.toFixed(1);
}

/** Reads ?d= from the URL and only allows yesterday / today / tomorrow. */
export function parseDayOffset(value: string | string[] | undefined): DayOffset {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return parsed === -1 || parsed === 1 ? parsed : 0;
}
