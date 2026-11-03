import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  leading?: ReactNode;
};

export function Field({
  id,
  label,
  hint,
  leading,
  className = "",
  ...props
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-bold text-cocoa-700"
      >
        {label}
      </label>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-brand-500">
            {leading}
          </span>
        ) : null}
        <input
          id={id}
          className={[
            "h-14 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 text-base font-semibold text-cocoa-900",
            "placeholder:font-medium placeholder:text-cocoa-400",
            "transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100",
            "disabled:opacity-60",
            leading ? "pl-12" : "",
            className,
          ]
            .join(" ")
            .trim()}
          {...props}
        />
      </div>
      {hint ? <p className="text-xs text-cocoa-400">{hint}</p> : null}
    </div>
  );
}
