import { StarIcon } from "@/components/icons";
import type { FeedbackEntry } from "@/lib/data/feedback";
import { MEAL_META, formatMenuDate, formatTimestamp } from "@/lib/meals";

export function FeedbackHistory({ entries }: { entries: FeedbackEntry[] }) {
  return (
    <ul className="space-y-3">
      {entries.map((entry) => {
        const meta = entry.mealType ? MEAL_META[entry.mealType] : null;

        return (
          <li key={entry.id}>
            <article className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1 text-xs font-bold text-cocoa-700">
                  {meta ? <span aria-hidden>{meta.emoji}</span> : null}
                  {meta?.label ?? "Meal"}
                  {entry.menuDate ? ` · ${formatMenuDate(entry.menuDate)}` : ""}
                </span>

                {entry.stars ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cocoa-500">
                    <StarIcon className="size-3.5 text-star" />
                    You rated {entry.stars}/5
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-relaxed font-medium whitespace-pre-line text-cocoa-700">
                {entry.comment}
              </p>

              <p className="mt-2 text-xs font-semibold text-cocoa-400">
                Sent {formatTimestamp(entry.createdAt)}
              </p>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
