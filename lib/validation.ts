import type {
  MealType,
  ReportCategory,
  ReportStatus,
} from "@/lib/database.types";

/** Keep these in sync with supabase/migrations/0002_student_modules.sql. */
export const FEEDBACK_MAX_LENGTH = 500;
export const REPORT_MAX_LENGTH = 500;
export const MAX_MENU_ITEMS = 20;
export const MAX_ITEM_LENGTH = 60;
export const MAX_PRICE = 10000;

export const REPORT_CATEGORIES: {
  value: ReportCategory;
  label: string;
  hint: string;
}[] = [
  { value: "delay", label: "Delay", hint: "Late or skipped meal service" },
  { value: "cleanliness", label: "Cleanliness", hint: "Hygiene in the dining hall or kitchen" },
  { value: "quality", label: "Quality", hint: "Taste, freshness or portion size" },
  { value: "other", label: "Other", hint: "Anything else the admin should know" },
];

const CATEGORY_VALUES = REPORT_CATEGORIES.map((category) => category.value);

const CATEGORY_LABELS = new Map(
  REPORT_CATEGORIES.map((category) => [category.value, category.label]),
);

export function reportCategoryLabel(category: ReportCategory): string {
  return CATEGORY_LABELS.get(category) ?? "Other";
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type Validated<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export function validateMenuId(input: unknown): Validated<string> {
  if (typeof input !== "string" || !UUID_PATTERN.test(input)) {
    return { ok: false, message: "That meal no longer exists. Refresh the page and try again." };
  }
  return { ok: true, value: input };
}

/** Stars must be a whole number from 1 to 5. */
export function validateStars(input: unknown): Validated<number> {
  const stars = typeof input === "number" ? input : Number(input);

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { ok: false, message: "Pick a rating between 1 and 5 stars." };
  }
  return { ok: true, value: stars };
}

/** Trimmed text that is neither blank nor longer than `max`. */
export function validateText(
  input: unknown,
  { max, label }: { max: number; label: string },
): Validated<string> {
  if (typeof input !== "string") {
    return { ok: false, message: `Please write ${label}.` };
  }

  const value = input.trim();

  if (!value) {
    return { ok: false, message: `Please write ${label} — it can't be blank.` };
  }
  if (value.length > max) {
    return {
      ok: false,
      message: `That's ${value.length} characters — please keep it under ${max}.`,
    };
  }

  return { ok: true, value };
}

export function validateCategory(input: unknown): Validated<ReportCategory> {
  if (
    typeof input !== "string" ||
    !CATEGORY_VALUES.includes(input as ReportCategory)
  ) {
    return { ok: false, message: "Choose a category for this report." };
  }
  return { ok: true, value: input as ReportCategory };
}

/* --------------------------------------------------------------------------
 * Administrator input (menu manager + report triage)
 * -------------------------------------------------------------------------- */

const MEAL_VALUES: MealType[] = ["breakfast", "lunch", "dinner"];
const STATUS_VALUES: ReportStatus[] = ["open", "in_progress", "resolved"];

export function isMealType(input: unknown): input is MealType {
  return typeof input === "string" && MEAL_VALUES.includes(input as MealType);
}

export function isReportStatus(input: unknown): input is ReportStatus {
  return typeof input === "string" && STATUS_VALUES.includes(input as ReportStatus);
}

/** A real calendar date in YYYY-MM-DD form. */
export function validateMenuDate(input: unknown): Validated<string> {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return { ok: false, message: "Pick a date for this menu." };
  }

  const parsed = new Date(`${input}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== input) {
    return { ok: false, message: "That isn't a valid date." };
  }

  return { ok: true, value: input };
}

export function validateMealType(input: unknown): Validated<MealType> {
  if (!isMealType(input)) {
    return { ok: false, message: "Choose breakfast, lunch or dinner." };
  }
  return { ok: true, value: input };
}

/** Trims, drops blanks and duplicates, and enforces 1-20 short items. */
export function validateMenuItems(input: unknown): Validated<string[]> {
  if (!Array.isArray(input)) {
    return { ok: false, message: "Add at least one dish to the menu." };
  }

  const seen = new Set<string>();
  const items: string[] = [];

  for (const entry of input) {
    if (typeof entry !== "string") continue;
    const value = entry.trim().replace(/\s+/g, " ");
    if (!value) continue;
    if (value.length > MAX_ITEM_LENGTH) {
      return {
        ok: false,
        message: `That dish name is too long - keep each item under ${MAX_ITEM_LENGTH} characters.`,
      };
    }
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(value);
  }

  if (items.length === 0) {
    return { ok: false, message: "Add at least one dish to the menu." };
  }
  if (items.length > MAX_MENU_ITEMS) {
    return {
      ok: false,
      message: `That's ${items.length} dishes - please keep a menu to ${MAX_MENU_ITEMS} or fewer.`,
    };
  }

  return { ok: true, value: items };
}

/** Price per meal in rupees, 0-10000, rounded to paise. */
export function validatePrice(input: unknown): Validated<number> {
  const price = typeof input === "number" ? input : Number(input);

  if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
    return { ok: false, message: `Enter a price between 0 and ${MAX_PRICE} rupees.` };
  }

  return { ok: true, value: Math.round(price * 100) / 100 };
}
