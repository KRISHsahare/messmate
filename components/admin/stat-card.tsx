import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
};

const tones = {
  neutral: "text-cocoa-900",
  good: "text-leaf-700",
  warn: "text-brand-700",
};

export function StatCard({ label, value, hint, tone = "neutral" }: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
      <p className="text-[11px] font-bold tracking-[0.08em] text-cocoa-400 uppercase">
        {label}
      </p>
      <p className={`mt-1.5 font-display text-3xl font-extrabold ${tones[tone]}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs font-semibold text-cocoa-500">{hint}</p> : null}
    </div>
  );
}
