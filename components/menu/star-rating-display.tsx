import { StarIcon } from "@/components/icons";

/** Static 1–5 stars with a partially filled overlay for averages like 4.3. */
export function StarRatingDisplay({
  value,
  size = "sm",
}: {
  value: number | null;
  size?: "sm" | "md";
}) {
  const percentage = Math.max(0, Math.min(100, ((value ?? 0) / 5) * 100));
  const starClass = size === "md" ? "size-4" : "size-3.5";
  const stars = [0, 1, 2, 3, 4];

  return (
    <span className="relative inline-flex" aria-hidden>
      <span className="flex gap-0.5 text-cream-300">
        {stars.map((star) => (
          <StarIcon key={star} className={starClass} />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-star"
        style={{ width: `${percentage}%` }}
      >
        {stars.map((star) => (
          <StarIcon key={star} className={`${starClass} shrink-0`} />
        ))}
      </span>
    </span>
  );
}
