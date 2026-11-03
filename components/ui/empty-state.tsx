import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-dashed border-cream-300 bg-white/70 px-5 py-10 text-center">
      {icon ? (
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          {icon}
        </span>
      ) : null}
      <h2 className="mt-4 text-lg font-extrabold text-cocoa-900">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed font-medium text-cocoa-500">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
