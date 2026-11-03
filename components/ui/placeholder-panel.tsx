import type { ReactNode } from "react";

type PlaceholderPanelProps = {
  icon?: ReactNode;
  badge?: string;
  title: string;
  description: string;
  points?: string[];
};

export function PlaceholderPanel({
  icon,
  badge,
  title,
  description,
  points,
}: PlaceholderPanelProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-cream-200 sm:p-8">
      <div className="flex items-start gap-4">
        {icon ? (
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {badge ? (
            <span className="inline-flex items-center rounded-full bg-leaf-100 px-3 py-1 text-[11px] font-bold tracking-wide text-leaf-700 uppercase">
              {badge}
            </span>
          ) : null}
          <h2 className="mt-2 text-xl font-extrabold text-cocoa-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed font-medium text-cocoa-500">
            {description}
          </p>
        </div>
      </div>

      {points?.length ? (
        <ul className="mt-5 space-y-2 rounded-2xl bg-cream-100 p-4">
          {points.map((point) => (
            <li
              key={point}
              className="flex gap-2 text-sm font-semibold text-cocoa-700"
            >
              <span aria-hidden className="text-brand-500">
                •
              </span>
              {point}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
