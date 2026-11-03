import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold " +
  "transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-[var(--shadow-cta)] hover:bg-brand-600",
  secondary:
    "bg-white text-cocoa-900 ring-1 ring-cream-300 shadow-[var(--shadow-card)] hover:bg-cream-50",
  ghost: "bg-transparent text-cocoa-700 hover:bg-cream-200",
  danger: "bg-danger text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  md: "h-12 px-6 text-[15px]", // 48px — comfortable tap target
  lg: "h-14 px-8 text-base",
};

export function buttonStyles(options?: {
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const { variant = "primary", size = "md", className = "" } = options ?? {};
  return [base, variants[variant], sizes[size], className].join(" ").trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
