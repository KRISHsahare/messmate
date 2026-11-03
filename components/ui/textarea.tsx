import type { ReactNode, TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  footer?: ReactNode;
  error?: string | null;
};

export function Textarea({
  id,
  label,
  footer,
  error,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-bold text-cocoa-700">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={[
          "w-full resize-y rounded-2xl border bg-cream-50 px-3.5 py-3 text-base font-medium text-cocoa-900",
          "placeholder:font-medium placeholder:text-cocoa-400",
          "transition focus:bg-white focus:outline-none focus:ring-4",
          error
            ? "border-danger focus:border-danger focus:ring-danger/15"
            : "border-cream-300 focus:border-brand-400 focus:ring-brand-100",
          className,
        ]
          .join(" ")
          .trim()}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      ) : null}
      {footer}
    </div>
  );
}
