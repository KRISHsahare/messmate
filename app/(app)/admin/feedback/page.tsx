import Link from "next/link";

import { ChatIcon, StarIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { PageHeading } from "@/components/ui/page-heading";
import { Select } from "@/components/ui/select";
import { listAllFeedback, parseFeedbackFilters } from "@/lib/data/admin";
import { MEAL_META, MEAL_ORDER, formatMenuDate, formatTimestamp } from "@/lib/meals";

export const metadata = { title: "Feedback table" };

type SearchParams = Promise<{
  from?: string;
  to?: string;
  meal?: string;
  order?: string;
}>;

const ORDER_OPTIONS = [
  { value: "date_desc", label: "Newest meal first" },
  { value: "date_asc", label: "Oldest meal first" },
  { value: "stars_desc", label: "Highest rating" },
  { value: "stars_asc", label: "Lowest rating" },
  { value: "student_asc", label: "Student A–Z" },
  { value: "student_desc", label: "Student Z–A" },
];

function hasFilters(filters: { from?: string; to?: string; meal: string }) {
  return Boolean(filters.from || filters.to || filters.meal !== "all");
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters = parseFeedbackFilters(params);
  const order = params.order ?? "date_desc";
  const { rows, truncated } = await listAllFeedback(filters);

  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow="Feedback"
        title="Every comment"
        description="All written feedback across the messes, with the meal it describes and the stars the student gave."
        action={
          <span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-cocoa-700 ring-1 ring-cream-300">
            {rows.length} {rows.length === 1 ? "comment" : "comments"}
          </span>
        }
      />

      <form
        action="/admin/feedback"
        method="get"
        className="grid gap-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.2fr_auto]"
      >
        <Field
          id="feedback-from"
          name="from"
          label="From"
          type="date"
          defaultValue={filters.from ?? ""}
        />
        <Field
          id="feedback-to"
          name="to"
          label="To"
          type="date"
          defaultValue={filters.to ?? ""}
        />
        <Select id="feedback-meal" name="meal" label="Meal" defaultValue={filters.meal}>
          <option value="all">All meals</option>
          {MEAL_ORDER.map((meal) => (
            <option key={meal} value={meal}>
              {MEAL_META[meal].label}
            </option>
          ))}
        </Select>
        <Select
          id="feedback-order"
          name="order"
          label="Sort by"
          defaultValue={ORDER_OPTIONS.some((option) => option.value === order) ? order : "date_desc"}
        >
          {ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="flex items-end gap-2">
          <button type="submit" className={buttonStyles({ className: "h-14 px-5" })}>
            Apply
          </button>
          {hasFilters(filters) || order !== "date_desc" ? (
            <Link
              href="/admin/feedback"
              className={buttonStyles({ variant: "ghost", className: "h-14 px-3" })}
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ChatIcon className="size-6" />}
          title="No comments match"
          description="Try a wider date range or another meal — comments appear here the moment a student sends one."
          action={
            <Link href="/admin/feedback" className={buttonStyles({ variant: "secondary" })}>
              Reset filters
            </Link>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)] ring-1 ring-cream-200 md:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Student feedback with meal, date, rating and comment
              </caption>
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50 text-[11px] font-extrabold tracking-[0.08em] text-cocoa-400 uppercase">
                  <th scope="col" className="px-4 py-3">Student</th>
                  <th scope="col" className="px-4 py-3">Meal</th>
                  <th scope="col" className="px-4 py-3">Stars</th>
                  <th scope="col" className="px-4 py-3">Comment</th>
                  <th scope="col" className="px-4 py-3">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-cocoa-900">{row.studentName}</p>
                      <p className="text-xs font-semibold text-cocoa-400">{row.messName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-cocoa-700">
                        {MEAL_META[row.mealType].label}
                      </p>
                      <p className="text-xs font-semibold text-cocoa-400">
                        {formatMenuDate(row.menuDate)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {row.stars === null ? (
                        <span className="text-xs font-semibold text-cocoa-400">–</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-extrabold text-brand-700">
                          <StarIcon className="size-3.5 text-star" />
                          {row.stars}
                        </span>
                      )}
                    </td>
                    <td className="max-w-md px-4 py-3 text-cocoa-700">
                      {row.comment}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap text-cocoa-400">
                      {formatTimestamp(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-cocoa-900">
                      {row.studentName}
                    </p>
                    <p className="text-xs font-semibold text-cocoa-400">
                      {MEAL_META[row.mealType].label} ·{" "}
                      {formatMenuDate(row.menuDate)}
                    </p>
                  </div>
                  {row.stars === null ? null : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-extrabold text-brand-700">
                      <StarIcon className="size-3.5 text-star" />
                      {row.stars}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-cocoa-700">{row.comment}</p>
                <p className="mt-2 text-[11px] font-semibold text-cocoa-400">
                  {row.messName} · {formatTimestamp(row.createdAt)}
                </p>
              </li>
            ))}
          </ul>

          {truncated ? (
            <p className="text-center text-xs font-semibold text-cocoa-400">
              Showing the most recent 400 comments — narrow the date range to see
              older ones.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
