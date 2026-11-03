import { StarIcon } from "@/components/icons";
import type { RatingBucket } from "@/lib/data/discovery";
import { MEAL_META } from "@/lib/meals";

/** Star distribution + per-meal averages for the public mess page. */
export function RatingBreakdown({ buckets }: { buckets: RatingBucket[] }) {
  const totals = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: buckets.reduce(
      (sum, bucket) =>
        sum + (bucket.distribution.find((entry) => entry.stars === stars)?.count ?? 0),
      0,
    ),
  }));

  const total = totals.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h3 className="text-sm font-extrabold text-cocoa-900">Star breakdown</h3>
        {total === 0 ? (
          <p className="mt-2 text-xs font-semibold text-cocoa-400">
            No ratings yet — be the first after your next meal.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {totals.map((entry) => {
              const percent = total === 0 ? 0 : Math.round((entry.count / total) * 100);
              return (
                <li key={entry.stars} className="flex items-center gap-2">
                  <span className="flex w-8 items-center gap-0.5 text-xs font-bold text-cocoa-500">
                    {entry.stars}
                    <StarIcon className="size-3 text-star" />
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream-200">
                    <span
                      className="block h-full rounded-full bg-brand-400"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-9 text-right text-xs font-semibold text-cocoa-400">
                    {percent}%
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-cocoa-900">By meal</h3>
        {buckets.length === 0 ? (
          <p className="mt-2 text-xs font-semibold text-cocoa-400">
            No meals have been rated yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {buckets.map((bucket) => (
              <li
                key={bucket.mealType}
                className="flex items-center justify-between gap-2 rounded-xl bg-cream-50 px-3 py-2"
              >
                <span className="text-xs font-bold text-cocoa-700">
                  <span aria-hidden>{MEAL_META[bucket.mealType].emoji}</span>{" "}
                  {MEAL_META[bucket.mealType].label}
                </span>
                <span className="text-xs font-extrabold text-cocoa-900">
                  {bucket.averageStars === null
                    ? "–"
                    : bucket.averageStars.toFixed(1)}
                  <span className="ml-1 font-semibold text-cocoa-400">
                    ({bucket.ratingCount})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
