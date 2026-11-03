import Link from "next/link";

import { FlagIcon } from "@/components/icons";
import { ReportForm } from "@/components/reports/report-form";
import { ReportList } from "@/components/reports/report-list";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { listMyReports } from "@/lib/data/reports";

export const metadata = { title: "Report a problem" };

export default async function ReportPage() {
  const result = await listMyReports();
  const reports = result.status === "ok" ? result.reports : [];

  return (
    <div className="space-y-5">
      <PageHeading
        eyebrow="Service issues"
        title="Report a problem"
        description="Late meals, hygiene or food quality — the mess admin sees every report and updates its status."
      />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <ReportForm />

        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-extrabold text-cocoa-900">Your reports</h2>
            {reports.length > 0 ? (
              <span className="text-xs font-bold text-cocoa-400">
                {reports.length} total
              </span>
            ) : null}
          </div>

          {result.status === "error" ? (
            <EmptyState
              icon={<FlagIcon className="size-6" />}
              title="We couldn't load your reports"
              description={result.message}
              action={
                <Link href="/report" className={buttonStyles({ variant: "secondary" })}>
                  Try again
                </Link>
              }
            />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<FlagIcon className="size-6" />}
              title="No reports yet"
              description="Nothing to track right now. If a meal is late, cold, or the dining hall needs attention, send a report above."
            />
          ) : (
            <ReportList reports={reports} />
          )}
        </section>
      </div>
    </div>
  );
}
