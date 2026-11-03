import { FeedbackBox } from "@/components/menu/feedback-box";
import { MealRating } from "@/components/menu/meal-rating";
import { StarRatingDisplay } from "@/components/menu/star-rating-display";
import type { MealEntry } from "@/lib/data/menus";
import { MEAL_META, formatAverage, formatTimestamp } from "@/lib/meals";

type MealCardProps = {
  meal: MealEntry;
};

export function MealCard({ meal }: MealCardProps) {
  const meta = MEAL_META[meal.mealType];
  const average = formatAverage(meal.averageStars);
  const latestComment = meal.myComments[0];
  const extraComments = meal.myComments.length - 1;

  return (
    <article className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl"
          >
            {meta.emoji}
          </span>
          <div className="min-w-0">
            <h2 className="text-lg leading-tight font-extrabold text-cocoa-900">
              {meta.label}
            </h2>
            <p className="text-xs font-semibold text-cocoa-400">{meta.window}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          {meal.menuId && average ? (
            <>
              <div className="flex items-center justify-end gap-1.5">
                <StarRatingDisplay value={meal.averageStars} />
                <span className="text-sm font-extrabold text-cocoa-900">
                  {average}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-cocoa-400">
                {meal.ratingCount} {meal.ratingCount === 1 ? "rating" : "ratings"}
              </p>
            </>
          ) : (
            <span className="inline-flex rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-bold text-cocoa-400">
              No ratings yet
            </span>
          )}
        </div>
      </header>

      {meal.menuId ? (
        <>
          <ul className="flex flex-wrap gap-1.5">
            {meal.items.map((item) => (
              <li
                key={item}
                className="rounded-full bg-cream-100 px-3 py-1 text-[13px] font-semibold text-cocoa-700"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="space-y-4 border-t border-cream-200 pt-4">
            <MealRating menuId={meal.menuId} myStars={meal.myStars} />

            <FeedbackBox menuId={meal.menuId} mealLabel={meta.label} />

            {latestComment ? (
              <div className="rounded-2xl bg-cream-100 p-3">
                <p className="text-[11px] font-bold tracking-wide text-cocoa-400 uppercase">
                  Your latest note
                </p>
                <p className="mt-1 text-sm leading-relaxed font-medium text-cocoa-700">
                  {latestComment.comment}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-cocoa-400">
                  {formatTimestamp(latestComment.createdAt)}
                  {extraComments > 0
                    ? ` · +${extraComments} more in My Feedback`
                    : ""}
                </p>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-cream-300 bg-cream-50 px-4 py-6 text-center text-sm font-semibold text-cocoa-400">
          {meta.label} isn&apos;t published for this day yet.
        </p>
      )}
    </article>
  );
}
