import Link from "next/link";
import { notFound } from "next/navigation";

import { RatingBreakdown } from "@/components/discovery/rating-breakdown";
import { BowlIcon, PinIcon, StarIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getMessDetail } from "@/lib/data/discovery";
import { MEAL_META, formatMenuDate, formatTimestamp } from "@/lib/meals";
import { formatPrice, monthlyEstimate } from "@/lib/pricing";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const result = await getMessDetail(id);
  if (result.status !== "ok") return { title: "Mess not found" };

  return {
    title: result.detail.mess.name,
    description: `${result.detail.mess.name} · ${
      result.detail.stats.averageStars === null
        ? "no ratings yet"
        : `${result.detail.stats.averageStars.toFixed(1)} stars`
    } · today's menu, price and recent reviews.`,
  };
}

export default async function MessDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const result = await getMessDetail(id);

  if (result.status === "not-found") notFound();

  if (result.status === "error") {
    return (
      <EmptyState
        icon={<BowlIcon className="size-6" />}
        title="We couldn't load this mess"
        description="The directory is having trouble reaching the database. Please try again in a moment."
        action={
          <Link href="/messes" className={buttonStyles({ variant: "secondary" })}>
            Back to the directory
          </Link>
        }
      />
    );
  }

  const { mess, stats, today, breakdown, reviews } = result.detail;

  return (
    <div className="space-y-5">
      <Link
        href="/messes"
        className="inline-flex text-xs font-extrabold text-brand-600 underline-offset-4 hover:underline"
      >
        ← All messes
      </Link>

      <section className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-cocoa-900 sm:text-3xl">
              {mess.name}
            </h1>
            {mess.location ? (
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-cocoa-500">
                <PinIcon className="size-4 text-brand-500" />
                {mess.location}
              </p>
            ) : null}
            {mess.address ? (
              <p className="mt-0.5 text-xs font-semibold text-cocoa-400">
                {mess.address}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-extrabold text-brand-700">
              {formatPrice(mess.price_per_meal)}
              {mess.price_per_meal === null ? null : " / meal"}
            </span>
            {mess.price_per_meal === null ? null : (
              <p className="text-[11px] font-semibold text-cocoa-400">
                about {monthlyEstimate(mess.price_per_meal)} for 2 meals a day
              </p>
            )}
            <Link
              href={`/messes/compare?ids=${mess.id}`}
              className={buttonStyles({ variant: "secondary", className: "h-10 px-4 text-xs" })}
            >
              Compare this mess
            </Link>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-cream-200 pt-4">
          <div>
            <dt className="text-[11px] font-bold tracking-[0.08em] text-cocoa-400 uppercase">
              Rating
            </dt>
            <dd className="mt-1 flex items-center gap-1 font-display text-2xl font-extrabold text-cocoa-900">
              <StarIcon className="size-5 text-star" />
              {stats.averageStars === null ? "–" : stats.averageStars.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-[0.08em] text-cocoa-400 uppercase">
              Ratings
            </dt>
            <dd className="mt-1 font-display text-2xl font-extrabold text-cocoa-900">
              {stats.ratingCount}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-[0.08em] text-cocoa-400 uppercase">
              Reviews
            </dt>
            <dd className="mt-1 font-display text-2xl font-extrabold text-cocoa-900">
              {stats.commentCount}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="today-menu">
        <h2 id="today-menu" className="text-lg font-extrabold text-cocoa-900">
          Today&apos;s menu
        </h2>
        {today.length === 0 ? (
          <p className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-cocoa-500 ring-1 ring-cream-200">
            No menu has been published for today yet.
          </p>
        ) : (
          <ul className="mt-2 grid gap-3 sm:grid-cols-3">
            {today.map((meal) => (
              <li
                key={meal.mealType}
                className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200"
              >
                <p className="text-sm font-extrabold text-cocoa-900">
                  <span aria-hidden>{MEAL_META[meal.mealType].emoji}</span>{" "}
                  {MEAL_META[meal.mealType].label}
                </p>
                <p className="text-[11px] font-semibold text-cocoa-400">
                  {MEAL_META[meal.mealType].window}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {meal.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-cocoa-700"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
        <h2 className="text-lg font-extrabold text-cocoa-900">Ratings</h2>
        <div className="mt-3">
          <RatingBreakdown buckets={breakdown} />
        </div>
      </section>

      <section aria-labelledby="recent-reviews">
        <h2 id="recent-reviews" className="text-lg font-extrabold text-cocoa-900">
          Recent reviews
        </h2>
        <p className="text-xs font-semibold text-cocoa-500">
          Students are shown by initials only — comments are public, identities are not.
        </p>

        {reviews.length === 0 ? (
          <p className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-cocoa-500 ring-1 ring-cream-200">
            No written reviews yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {reviews.map((review, index) => (
              <li
                key={`${review.createdAt}-${index}`}
                className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-cream-200 text-xs font-extrabold text-cocoa-700">
                      {review.authorLabel}
                    </span>
                    {review.stars === null ? null : (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-cocoa-700">
                        <StarIcon className="size-3.5 text-star" />
                        {review.stars}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-cocoa-400">
                    {MEAL_META[review.mealType].label} ·{" "}
                    {formatMenuDate(review.menuDate)} ·{" "}
                    {formatTimestamp(review.createdAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-cocoa-700">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
