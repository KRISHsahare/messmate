"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateReportStatus } from "@/app/(app)/admin/actions";
import { useToast } from "@/components/ui/toast";
import type { ReportStatus } from "@/lib/database.types";

const OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

export function ReportStatusControl({
  reportId,
  status,
  studentName,
}: {
  reportId: string;
  status: ReportStatus;
  studentName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState<ReportStatus>(status);
  const [pending, startTransition] = useTransition();

  const onChange = (next: string) => {
    const previous = value;
    setValue(next as ReportStatus);

    startTransition(async () => {
      const result = await updateReportStatus({ reportId, status: next });
      if (!result.ok) {
        setValue(previous);
        toast({ message: result.message, tone: "error" });
        return;
      }

      const label = OPTIONS.find((option) => option.value === next)?.label ?? next;
      toast({ message: `Report marked ${label.toLowerCase()}.`, tone: "success" });
      router.refresh();
    });
  };

  return (
    <label className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-cocoa-400 uppercase">
      <span className="sr-only">Status for {studentName}&apos;s report</span>
      <span aria-hidden>Status</span>
      <select
        aria-label={`Status for ${studentName}'s report`}
        value={value}
        disabled={pending}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-full border border-cream-300 bg-cream-50 px-3 text-xs font-bold text-cocoa-900 transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100 focus:outline-none disabled:opacity-60"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
