import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your reports…</span>
      <PageSkeleton cards={0} />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-cream-200">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
