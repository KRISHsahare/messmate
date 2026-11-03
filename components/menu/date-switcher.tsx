import Link from "next/link";

import { DAY_OFFSETS, dayOffsetLabel, formatMenuDate } from "@/lib/meals";

type DateSwitcherProps = {
  active: number;
  date: string;
};

export function DateSwitcher({ active, date }: DateSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <nav
        aria-label="Choose a menu day"
        className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-cream-300"
      >
        {DAY_OFFSETS.map((offset) => {
          const isActive = offset === active;

          return (
            <Link
              key={offset}
              href={offset === 0 ? "/menu" : `/menu?d=${offset}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex h-9 items-center rounded-full px-3.5 text-sm font-bold transition",
                isActive
                  ? "bg-brand-500 text-white shadow-[var(--shadow-cta)]"
                  : "text-cocoa-500 hover:bg-cream-100",
              ].join(" ")}
            >
              {dayOffsetLabel(offset)}
            </Link>
          );
        })}
      </nav>

      <p className="text-sm font-bold text-cocoa-500">{formatMenuDate(date)}</p>
    </div>
  );
}
