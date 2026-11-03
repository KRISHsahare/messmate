import Link from "next/link";

import {
  MealComparisonChart,
  RatingTrendChart,
} from "@/components/admin/rating-charts";
import { StatCard } from "@/components/admin/stat-card";
import { ArrowRightIcon, FlagIcon, StarIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { getAdminMess, getAdminOverview } from "@/lib/data/admin";
import { formatMenuDate } from "@/lib/meals";
import { MEAL_META } from "@/lib/meals";

export const metadata = { title: "Admin overview" };

function stars(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

export default async function AdminOverviewPage() {
  const [overview, mess] = await Promise.all([getAdminOverview(), getAdminMess()]);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Administrator"
        title="Admin console"
        description={`Every rating, comment and report across ${overview.messCount} messes — ${mess.name} is the menu you manage.`}
        action={
          <Link href="/admin/menu" className={buttonStyles({ size: "md" })}>
            Edit today&apos;s menu
          </Link>
        }
      />

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Today"
          value={stars(overview.today)}
          hint={
            overview.todayVotes === 0
              ? "No ratings yet"
              : `from ${overview.todayVotes} ratings`
          }
          tone={
            overview.today !== null && overview.today < 2.5 ? "warn" : "neutral"
          }
        />
        <StatCard
          label="This week"
          value={stars(overview.week)}
          hint="last 7 days"
        />
        <StatCard
          label="This month"
          value={stars(overview.month)}
          hint="calendar month so far"
        />
        <StatCard
          label="Feedback"
          value={overview.totalFeedback}
          hint="comments collected"
        />
        <StatCard
          label="Open reports"
          value={overview.openReports}
          hint={`${overview.inProgressReports} in progress`}
          tone={overview.openReports > 0 ? "warn" : "good"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Rating charts">
        <RatingTrendChart data={overview.trend} />
        <MealComparisonChart data={overview.meals} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-cocoa-900">
                <FlagIcon className="size-5 text-brand-500" />
                Needs attention
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-cocoa-500">
                Meals in the last 7 days averaging below 2.5 stars.
              </p>
            </div>
            <span className="rounded-full bg-danger-soft px-3 py-1 text-xs font-extrabold text-danger">
              {overview.attention.length} flagged
            </span>
          </div>

          {overview.attention.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-leaf-100 px-4 py-3 text-sm font-semibold text-leaf-700">
              Every recent meal is holding above 2.5 stars. Nothing to chase today.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-cream-200">
              {overview.attention.map((meal) => (
                <li
                  key={meal.menuId}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-cocoa-900">
                      {MEAL_META[meal.mealType].label} · {formatMenuDate(meal.date)}
                    </p>
                    <p className="truncate text-xs font-semibold text-cocoa-500">
                      {meal.messName} · {meal.ratingCount}{" "}
                      {meal.ratingCount === 1 ? "rating" : "ratings"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-extrabold text-danger">
                      <StarIcon className="size-3.5" />
                      {meal.averageStars.toFixed(1)}
                    </span>
                    <Link
                      href={`/admin/feedback?from=${meal.date}&to=${meal.date}&meal=${meal.mealType}`}
                      className="text-xs font-bold text-brand-600 underline-offset-4 hover:underline"
                    >
                      Read comments
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
          <h2 className="text-lg font-extrabold text-cocoa-900">Jump to</h2>
          <ul className="space-y-2">
            {[
              {
                href: "/admin/menu",
                title: "Menu manager",
                copy: "Publish, edit or remove meals for any date.",
              },
              {
                href: "/admin/feedback",
                title: "Feedback table",
                copy: "Filter comments by date, meal and rating.",
              },
              {
                href: "/admin/reports",
                title: "Reports inbox",
                copy: "Triage service issues from open to resolved.",
              },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-cream-50 px-4 py-3 ring-1 ring-cream-200 transition hover:bg-cream-100"
                >
                  <span>
                    <span className="block text-sm font-extrabold text-cocoa-900">
                      {link.title}
                    </span>
                    <span className="block text-xs font-semibold text-cocoa-500">
                      {link.copy}
                    </span>
                  </span>
                  <ArrowRightIcon className="size-4 shrink-0 text-brand-500" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
