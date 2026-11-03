import Link from "next/link";

type LogoProps = {
  href?: string;
  showWordmark?: boolean;
  size?: "sm" | "md";
  className?: string;
};

const markSizes = {
  sm: "size-10",
  md: "size-12",
};

/** Steaming bowl mark + uppercase wordmark, inspired by the launch artwork. */
export function Logo({
  href,
  showWordmark = true,
  size = "md",
  className = "",
}: LogoProps) {
  const content = (
    <span className={`flex items-center gap-3 ${className}`.trim()}>
      <span
        className={`grid ${markSizes[size]} place-items-center rounded-full bg-brand-500 text-white shadow-[var(--shadow-cta)]`}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M7 7c0-1.4 1.1-2.5 2.5-2.5S12 5.6 12 7" />
          <path d="M17 7c0-1.4-1.1-2.5-2.5-2.5S12 5.6 12 7" />
          <path d="M4 10h16a8 8 0 0 1-16 0Z" fill="currentColor" stroke="none" />
          <path d="M9 18h6" />
        </svg>
      </span>
      {showWordmark ? (
        <span className="font-display text-xl font-extrabold tracking-tight text-cocoa-900 uppercase sm:text-[22px]">
          Mess Mate
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
      >
        {content}
      </Link>
    );
  }

  return content;
}
