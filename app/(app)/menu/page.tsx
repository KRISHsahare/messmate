import Link from "next/link";

import {
  ArrowRightIcon,
  BowlIcon,
  CompassIcon,
  FlagIcon,
} from "@/components/icons";
import { DateSwitcher } from "@/components/menu/date-switcher";
import { MealCard } from "@/components/menu/meal-card";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { getDayMenu } from "@/lib/data/menus";
import { dayOffsetLabel, parseDayOffset } from "@/lib/meals";

export const metadata = { title: "Menu" };

export default async function MenuPage({ searchParams }: PageProps<"/menu">) {
  const params = await searchParams;
  const offset = parseDayOffset(params.d);
  const result = await getDayMenu(offset);
  const href = offset === 0 ? "/menu" : `/menu?d=${offset}`;

  if (result.status === "error") {
    return (
      <div className="space-y-6">
        <PageHeading eyebrow="Menu" title="Today's mess menu" />
        <EmptyState
          icon={<BowlIcon className="size-6" />}
          title="We couldn't load the menu"
          description={result.message}
          action={
            <Link href={href} className={buttonStyles({ variant: "secondary" })}>
              Try again
            </Link>
          }
        />
      </div>
    );
  }

  if (result.status === "no-mess") {
    return (
      <div className="space-y-6">
        <PageHeading eyebrow="Menu" title="Today's mess menu" />
        <EmptyState
          icon={<BowlIcon className="size-6" />}
          title="Your mess isn't linked yet"
          description="Your profile has no mess assigned, so there's no menu to show. Ask your mess secretary to link your account."
        />
      </div>
    );
  }

  const { day } = result;
  const publishedMeals = day.meals.filter((meal) => meal.menuId !== null);

  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow={dayOffsetLabel(offset)}
        title="Mess menu"
        description={
          day.messName
            ? `${day.messName} — tap a star to rate, or leave the kitchen a note.`
            : "Tap a star to rate each meal, or leave the kitchen a note."
        }
      />

      <DateSwitcher active={offset} date={day.date} />

      {publishedMeals.length === 0 ? (
        <EmptyState
          icon={<FlagIcon className="size-6" />}
          title="No menu published for this day"
          description="Menus are usually published the evening before. If a meal was expected and missing, let the admin know."
          action={
            <Link href="/report" className={buttonStyles({ variant: "secondary" })}>
              Report a problem
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {day.meals.map((meal) => (
            <MealCard key={meal.mealType} meal={meal} />
          ))}
        </div>
      )}

      <Link
        href="/messes"
        className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200 transition hover:bg-cream-50"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
            <CompassIcon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold text-cocoa-900">
              Compare messes nearby
            </span>
            <span className="block text-xs font-semibold text-cocoa-500">
              Prices, ratings and today&apos;s menu for every mess.
            </span>
          </span>
        </span>
        <ArrowRightIcon className="size-4 shrink-0 text-brand-500" />
      </Link>
    </div>
  );
}
