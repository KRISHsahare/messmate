import type { ReactNode } from "react";

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: PageHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold tracking-[0.12em] text-brand-600 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-extrabold text-cocoa-900 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm font-medium text-cocoa-500">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
