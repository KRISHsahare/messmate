import { getSession } from "@/lib/auth";
import type { ReportCategory, ReportStatus } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type ReportEntry = {
  id: string;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  createdAt: string;
};

export type MyReportsResult =
  | { status: "ok"; reports: ReportEntry[] }
  | { status: "error"; message: string };

const MAX_ENTRIES = 40;

/** The student's own reports, newest first (RLS scopes this to them). */
export async function listMyReports(): Promise<MyReportsResult> {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "Your session expired. Please log in again." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, category, description, status, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_ENTRIES);

  if (error) {
    return {
      status: "error",
      message: "We couldn't load your reports. Please refresh and try again.",
    };
  }

  return {
    status: "ok",
    reports: (data ?? []).map((report) => ({
      id: report.id,
      category: report.category,
      description: report.description,
      status: report.status,
      createdAt: report.created_at,
    })),
  };
}
