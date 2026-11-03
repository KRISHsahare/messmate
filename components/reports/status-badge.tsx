import type { ReportStatus } from "@/lib/database.types";

const STYLES: Record<
  ReportStatus,
  { label: string; className: string; dot: string }
> = {
  open: {
    label: "Open",
    className: "bg-brand-100 text-brand-700",
    dot: "bg-brand-500",
  },
  in_progress: {
    label: "In progress",
    className: "bg-sky-100 text-sky-700",
    dot: "bg-sky-700",
  },
  resolved: {
    label: "Resolved",
    className: "bg-leaf-100 text-leaf-700",
    dot: "bg-leaf-700",
  },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const style = STYLES[status] ?? STYLES.open;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${style.className}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
