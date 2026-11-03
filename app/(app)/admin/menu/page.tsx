import Link from "next/link";

import { MenuEditor } from "@/components/admin/menu-editor";
import { MessPriceForm } from "@/components/admin/mess-price-form";
import { BowlIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { PageHeading } from "@/components/ui/page-heading";
import { countUpcomingMenus, getMenuEditorDay } from "@/lib/data/admin";
import { formatMenuDate, istDateISO } from "@/lib/meals";
import { validateMenuDate } from "@/lib/validation";

export const metadata = { title: "Menu manager" };

type SearchParams = Promise<{ date?: string }>;

const QUICK_DAYS = [
  { offset: -1, label: "Yesterday" },
  { offset: 0, label: "Today" },
  { offset: 1, label: "Tomorrow" },
] as const;

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requested = validateMenuDate(params.date);
  const date = requested.ok ? requested.value : istDateISO();

  const day = await getMenuEditorDay(date);
  const upcoming = await countUpcomingMenus(day.mess.id);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Menu manager"
        title="Menus"
        description={`Publish, edit or remove any meal for ${day.mess.name}. Saving a meal updates what students see immediately.`}
      />

      <section className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form
            action="/admin/menu"
            method="get"
            className="flex flex-wrap items-end gap-3"
          >
            <div className="w-44">
              <Field
                id="menu-date"
                name="date"
                label="Menu date"
                type="date"
                defaultValue={date}
              />
            </div>
            <button
              type="submit"
              className={buttonStyles({ variant: "secondary" })}
            >
              Show day
            </button>
          </form>

          <ul className="flex flex-wrap gap-2">
            {QUICK_DAYS.map((quick) => {
              const iso = istDateISO(quick.offset);
              const active = iso === date;
              return (
                <li key={quick.label}>
                  <Link
                    href={`/admin/menu?date=${iso}`}
                    aria-current={active ? "page" : undefined}
                    className={buttonStyles({
                      variant: active ? "primary" : "secondary",
                      className: "h-11 px-4 text-sm",
                    })}
                  >
                    {quick.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-3 text-xs font-semibold text-cocoa-500">
          Showing <span className="text-cocoa-900">{formatMenuDate(date)}</span> ·{" "}
          {upcoming} of the next 21 meals are published.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
        <h2 className="text-base font-extrabold text-cocoa-900">
          Directory price · {day.mess.name}
        </h2>
        <p className="mt-0.5 mb-3 text-xs font-semibold text-cocoa-500">
          Shown on /messes and used when comparing messes.
        </p>
        <MessPriceForm price={day.mess.pricePerMeal} />
      </section>

      {day.mess.id ? (
        <MenuEditor key={date} date={date} meals={day.meals} />
      ) : (
        <EmptyState
          icon={<BowlIcon className="size-6" />}
          title="No mess linked"
          description="Your admin account isn't attached to a mess yet, so there is nowhere to publish a menu. Create a mess or link this profile first."
        />
      )}
    </div>
  );
}
