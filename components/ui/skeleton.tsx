export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-xl bg-cream-300/70 ${className}`.trim()}
    />
  );
}

/** Placeholder for a page title plus a supporting line. */
export function SkeletonHeading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

/** Placeholder for one menu / feedback / report card. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-3xl border border-cream-200 bg-white/70 p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={`h-3.5 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
          />
        ))}
      </div>
      <Skeleton className="mt-5 h-12 w-full rounded-full" />
    </div>
  );
}
