"use client";

import Link from "next/link";
import { useState } from "react";

import { ArrowRightIcon, PinIcon, StarIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import type { MessSummary } from "@/lib/data/discovery";
import { MEAL_META } from "@/lib/meals";
import { formatPrice } from "@/lib/pricing";

const MAX_COMPARE = 3;

function MessCard({
  mess,
  selected,
  disabled,
  onToggle,
}: {
  mess: MessSummary;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      aria-label={mess.name}
      className={[
        "flex h-full flex-col rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 transition",
        selected ? "ring-2 ring-brand-500" : "ring-cream-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg leading-snug font-extrabold text-cocoa-900">
            <Link href={`/messes/${mess.id}`} className="hover:underline">
              {mess.name}
            </Link>
          </h2>
          {mess.location ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-cocoa-500">
              <PinIcon className="size-3.5 shrink-0" />
              <span className="truncate">{mess.location}</span>
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-extrabold text-brand-700">
          {mess.price_per_meal === null
            ? "Price not listed"
            : `${formatPrice(mess.price_per_meal)} / meal`}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {mess.stats.averageStars === null ? (
          <span className="text-sm font-bold text-cocoa-400">No ratings yet</span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2.5 py-1 text-sm font-extrabold text-cocoa-900">
              <StarIcon className="size-4 text-star" />
              {mess.stats.averageStars.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-cocoa-400">
              {mess.stats.ratingCount}{" "}
              {mess.stats.ratingCount === 1 ? "rating" : "ratings"}
            </span>
          </>
        )}
      </div>

      <div className="mt-3 flex-1">
        <p className="text-[11px] font-bold tracking-[0.08em] text-cocoa-400 uppercase">
          Today&apos;s menu
        </p>
        {mess.today.length === 0 ? (
          <p className="mt-1 text-xs font-semibold text-cocoa-400">
            No menu published for today.
          </p>
        ) : (
          <ul className="mt-1 space-y-1.5">
            {mess.today.map((meal) => (
              <li key={meal.mealType} className="text-xs text-cocoa-700">
                <span className="font-extrabold">
                  {MEAL_META[meal.mealType].label}:
                </span>{" "}
                {meal.items.slice(0, 3).join(", ")}
                {meal.items.length > 3 ? ` +${meal.items.length - 3} more` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-bold text-cocoa-700">
          <input
            type="checkbox"
            checked={selected}
            disabled={disabled && !selected}
            onChange={onToggle}
            aria-label={`Compare ${mess.name}`}
            className="size-5 rounded border-cream-300 accent-[var(--color-brand-500)]"
          />
          Compare
        </label>
        <Link
          href={`/messes/${mess.id}`}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-600 underline-offset-4 hover:underline"
        >
          View mess
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function MessDirectory({
  messes,
  initialSelected,
}: {
  messes: MessSummary[];
  initialSelected: string[];
}) {
  const available = new Set(messes.map((mess) => mess.id));
  const [selected, setSelected] = useState<string[]>(
    initialSelected.filter((id) => available.has(id)).slice(0, MAX_COMPARE),
  );

  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, id];
    });
  };

  const canCompare = selected.length >= 2;

  return (
    <div className="pb-24">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {messes.map((mess) => (
          <li key={mess.id}>
            <MessCard
              mess={mess}
              selected={selected.includes(mess.id)}
              disabled={selected.length >= MAX_COMPARE}
              onToggle={() => toggle(mess.id)}
            />
          </li>
        ))}
      </ul>

      {selected.length > 0 ? (
        <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl bg-cocoa-900 px-4 py-3 text-cream-50 shadow-[var(--shadow-warm)]">
            <p className="text-sm font-bold">
              {selected.length} selected
              <span className="ml-1 font-semibold text-cream-300">
                · pick 2–{MAX_COMPARE}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected([])}
                className="rounded-full px-3 py-2 text-xs font-bold text-cream-200 transition hover:bg-white/10"
              >
                Clear
              </button>
              {canCompare ? (
                <Link
                  href={`/messes/compare?ids=${selected.join(",")}`}
                  className={buttonStyles({ className: "h-10 px-4 text-sm" })}
                >
                  Compare
                </Link>
              ) : (
                <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-cream-200">
                  Pick one more
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
