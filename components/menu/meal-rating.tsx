"use client";

import { useState, useOptimistic, useTransition } from "react";

import { rateMeal } from "@/app/(app)/menu/actions";
import { StarIcon } from "@/components/icons";
import { useToast } from "@/components/ui/toast";

type MealRatingProps = {
  menuId: string;
  myStars: number | null;
};

/**
 * Tap-to-rate stars. The new value shows instantly via useOptimistic and snaps
 * back to the stored value if the server rejects it.
 */
export function MealRating({ menuId, myStars }: MealRatingProps) {
  const [optimisticStars, setOptimisticStars] = useOptimistic<number | null, number>(
    myStars,
    (_current, next) => next,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const shownStars = optimisticStars;

  function rate(stars: number) {
    if (stars === myStars && !error) return;

    setError(null);

    startTransition(async () => {
      setOptimisticStars(stars);
      const result = await rateMeal({ menuId, stars });

      if (!result.ok) {
        setError(result.message);
        toast({ message: result.message, tone: "error" });
        return;
      }

      toast({
        message: myStars ? "Rating updated. Thanks!" : "Thanks for rating this meal!",
        tone: "success",
        durationMs: 2500,
      });
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-wide text-cocoa-500 uppercase">
          {myStars ? "Your rating" : "Rate this meal"}
        </p>
        {myStars ? (
          <p className="text-xs font-semibold text-cocoa-400">Tap to change</p>
        ) : null}
      </div>

      <div
        role="group"
        aria-label="Rate this meal"
        aria-busy={isPending}
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const active = shownStars !== null && star <= shownStars;

          return (
            <button
              key={star}
              type="button"
              onClick={() => rate(star)}
              disabled={isPending}
              aria-label={`Rate ${star} out of 5`}
              aria-pressed={shownStars === star}
              className={[
                "grid size-11 place-items-center rounded-full transition",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200",
                "disabled:cursor-progress",
                active ? "text-star" : "text-cream-300 hover:text-brand-300",
              ].join(" ")}
            >
              <StarIcon
                className={`size-7 transition-transform ${isPending ? "opacity-70" : "active:scale-90"}`}
              />
            </button>
          );
        })}

        <span className="ml-1 text-sm font-extrabold text-cocoa-700">
          {shownStars ? `${shownStars}/5` : "–"}
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      ) : (
        <p className="text-xs font-medium text-cocoa-400">
          {myStars ? "One rating per meal — yours is saved." : "One tap saves it."}
        </p>
      )}
    </div>
  );
}
