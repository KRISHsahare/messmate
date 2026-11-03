import { StatusBadge } from "@/components/reports/status-badge";
import type { ReportEntry } from "@/lib/data/reports";
import { formatTimestamp } from "@/lib/meals";
import { reportCategoryLabel } from "@/lib/validation";

export function ReportList({ reports }: { reports: ReportEntry[] }) {
  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.id}>
          <article className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex rounded-full bg-cream-100 px-3 py-1 text-xs font-bold text-cocoa-700">
                {reportCategoryLabel(report.category)}
              </span>
              <StatusBadge status={report.status} />
            </div>
            <p className="mt-3 text-sm leading-relaxed font-medium whitespace-pre-line text-cocoa-700">
              {report.description}
            </p>
            <p className="mt-2 text-xs font-semibold text-cocoa-400">
              Sent {formatTimestamp(report.createdAt)}
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}
