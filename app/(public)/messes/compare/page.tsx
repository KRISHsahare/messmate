import Link from "next/link";

import { CompassIcon, StarIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { getMessComparison } from "@/lib/data/discovery";
import { MEAL_META, MEAL_ORDER } from "@/lib/meals";
import { formatPrice } from "@/lib/pricing";

export const metadata = { title: "Compare messes" };

type SearchParams = Promise<{ ids?: string }>;

export default async function CompareMessesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const ids = (params.ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 3);

  const messes = await getMessComparison(ids);

  return (
    <div className="space-y-5">
      <Link
        href="/messes"
        className="inline-flex text-xs font-extrabold text-brand-600 underline-offset-4 hover:underline"
      >
        ← Back to the directory
      </Link>

      <PageHeading
        eyebrow="Compare"
        title="Side by side"
        description="Price per meal, crowd rating and today's full menu — no account needed."
      />

      {messes.length < 2 ? (
        <EmptyState
          icon={<CompassIcon className="size-6" />}
          title="Pick at least two messes"
          description="Choose two or three messes in the directory and press Compare to see them side by side."
          action={
            <Link href="/messes" className={buttonStyles()}>
              Choose messes
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-[var(--shadow-card)] ring-1 ring-cream-200">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Comparison of {messes.map((mess) => mess.name).join(", ")}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="w-32 px-4 py-4" />
                {messes.map((mess) => (
                  <th
                    key={mess.id}
                    scope="col"
                    className="border-l border-cream-200 px-4 py-4 align-top"
                  >
                    <Link
                      href={`/messes/${mess.id}`}
                      className="font-display text-base font-extrabold text-cocoa-900 hover:underline"
                    >
                      {mess.name}
                    </Link>
                    {mess.location ? (
                      <p className="mt-0.5 text-[11px] font-semibold text-cocoa-400">
                        {mess.location}
                      </p>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              <tr>
                <th
                  scope="row"
                  className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-cocoa-400 uppercase"
                >
                  Price / meal
                </th>
                {messes.map((mess) => (
                  <td
                    key={mess.id}
                    className="border-l border-cream-200 px-4 py-3 text-lg font-extrabold text-cocoa-900"
                  >
                    {formatPrice(mess.price_per_meal)}
                  </td>
                ))}
              </tr>
              <tr>
                <th
                  scope="row"
                  className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-cocoa-400 uppercase"
                >
                  Rating
                </th>
                {messes.map((mess) => (
                  <td
                    key={mess.id}
                    className="border-l border-cream-200 px-4 py-3"
                  >
                    <span className="inline-flex items-center gap-1 font-extrabold text-cocoa-900">
                      <StarIcon className="size-4 text-star" />
                      {mess.stats.averageStars === null
                        ? "–"
                        : mess.stats.averageStars.toFixed(1)}
                    </span>
                    <span className="ml-1 text-xs font-semibold text-cocoa-400">
                      ({mess.stats.ratingCount})
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <th
                  scope="row"
                  className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-cocoa-400 uppercase"
                >
                  Reviews
                </th>
                {messes.map((mess) => (
                  <td
                    key={mess.id}
                    className="border-l border-cream-200 px-4 py-3 font-semibold text-cocoa-700"
                  >
                    {mess.stats.commentCount}
                  </td>
                ))}
              </tr>
              {MEAL_ORDER.map((mealType) => (
                <tr key={mealType}>
                  <th
                    scope="row"
                    className="px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-cocoa-400 uppercase"
                  >
                    {MEAL_META[mealType].label}
                  </th>
                  {messes.map((mess) => {
                    const meal = mess.today.find(
                      (entry) => entry.mealType === mealType,
                    );
                    return (
                      <td
                        key={mess.id}
                        className="border-l border-cream-200 px-4 py-3 align-top text-xs text-cocoa-700"
                      >
                        {meal ? meal.items.join(", ") : (
                          <span className="font-semibold text-cocoa-400">
                            Not published
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-xs font-semibold text-cocoa-400">
        Prices and menus are maintained by each mess administrator.
      </p>
    </div>
  );
}
