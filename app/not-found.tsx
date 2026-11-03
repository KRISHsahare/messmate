import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-warm-wash grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-[2rem] bg-white p-8 text-center shadow-[var(--shadow-warm)] ring-1 ring-cream-200">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-cocoa-900">
            This plate is empty
          </h1>
          <p className="text-sm font-medium text-cocoa-500">
            We couldn&apos;t find that page. The menu is still warm though.
          </p>
        </div>
        <Link
          href="/menu"
          className={buttonStyles({ size: "lg", className: "w-full" })}
        >
          Back to menu
        </Link>
      </div>
    </main>
  );
}
