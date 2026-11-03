import type { ReactNode, SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  error?: string | null;
};

export function Select({
  id,
  label,
  children,
  hint,
  error,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-bold text-cocoa-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            "h-14 w-full appearance-none rounded-2xl border bg-cream-50 pr-11 pl-4 text-base font-semibold text-cocoa-900",
            "transition focus:bg-white focus:outline-none focus:ring-4",
            error
              ? "border-danger focus:border-danger focus:ring-danger/15"
              : "border-cream-300 focus:border-brand-400 focus:ring-brand-100",
            className,
          ]
            .join(" ")
            .trim()}
          {...props}
        >
          {children}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-cocoa-400"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      ) : null}
      {hint}
    </div>
  );
}
