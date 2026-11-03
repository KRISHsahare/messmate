import { Skeleton, SkeletonCard, SkeletonHeading } from "@/components/ui/skeleton";

/** Shared loading state for the protected pages. */
export function PageSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <SkeletonHeading />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      {Array.from({ length: cards }).map((_, index) => (
        <SkeletonCard key={index} lines={3} />
      ))}
    </div>
  );
}
