import Link from "next/link";

import { ReportStatusControl } from "@/components/admin/report-status-control";
import { FlagIcon } from "@/components/icons";
import { StatusBadge } from "@/components/reports/status-badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Select } from "@/components/ui/select";
import { listAllReports, parseReportFilters } from "@/lib/data/admin";
import { formatTimestamp } from "@/lib/meals";
import { REPORT_CATEGORIES, reportCategoryLabel } from "@/lib/validation";

export const metadata = { title: "Reports inbox" };

type SearchParams = Promise<{ status?: string; category?: string }>;

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

function reportsHref(status: string, category: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (category !== "all") params.set("category", category);
  const query = params.toString();
  return query ? `/admin/reports?${query}` : "/admin/reports";
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters = parseReportFilters(params);
  const reports = await listAllReports(filters);
  const openCount = reports.filter((report) => report.status === "open").length;

  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow="Reports"
        title="Service inbox"
        description="Every problem students have reported, newest first. Change a status to keep them informed."
        action={
          <span className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-cocoa-700 ring-1 ring-cream-300">
            {openCount} open
          </span>
        }
      />

      <div className="space-y-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
        <ul className="flex flex-wrap gap-2" aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => {
            const active = filters.status === filter.value;
            return (
              <li key={filter.value}>
                <Link
                  href={reportsHref(filter.value, filters.category)}
                  aria-current={active ? "page" : undefined}
                  className={buttonStyles({
                    variant: active ? "primary" : "secondary",
                    className: "h-10 px-4 text-xs",
                  })}
                >
                  {filter.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <form
          action="/admin/reports"
          method="get"
          className="flex flex-wrap items-end gap-3"
        >
          {filters.status !== "all" ? (
            <input type="hidden" name="status" value={filters.status} />
          ) : null}
          <div className="w-56">
            <Select
              id="report-category"
              name="category"
              label="Category"
              defaultValue={filters.category}
            >
              <option value="all">All categories</option>
              {REPORT_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="submit"
            className={buttonStyles({ variant: "secondary", className: "h-14 px-5" })}
          >
            Filter
          </button>
        </form>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={<FlagIcon className="size-6" />}
          title="Nothing in this filter"
          description="No reports match these filters yet. Students see the same statuses you set here."
          action={
            <Link
              href="/admin/reports"
              className={buttonStyles({ variant: "secondary" })}
            >
              Show all reports
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-cream-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={report.status} />
                    <span className="rounded-full bg-cream-200 px-2.5 py-1 text-[11px] font-bold tracking-wide text-cocoa-700 uppercase">
                      {reportCategoryLabel(report.category)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-cocoa-700">{report.description}</p>
                  <p className="mt-1.5 text-xs font-semibold text-cocoa-400">
                    {report.studentName} · {report.messName} ·{" "}
                    {formatTimestamp(report.createdAt)}
                  </p>
                </div>

                <ReportStatusControl
                  reportId={report.id}
                  status={report.status}
                  studentName={report.studentName}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
