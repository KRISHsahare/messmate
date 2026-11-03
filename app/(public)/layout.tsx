import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { buttonStyles } from "@/components/ui/button";
import { getSession, homeForRole, profileOrDefaults } from "@/lib/auth";

/**
 * Shell for pages anybody can read. The proxy leaves these routes alone, so a
 * signed-out visitor sees the directory and just the sign-in links.
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const profile = session ? profileOrDefaults(session) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo href="/messes" />
          <div className="flex items-center gap-2">
            {profile ? (
              <Link
                href={homeForRole(profile.role)}
                className={buttonStyles({ className: "h-11 px-4 text-sm" })}
              >
                My mess
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonStyles({
                    variant: "secondary",
                    className: "h-11 px-4 text-sm",
                  })}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className={buttonStyles({ className: "h-11 px-4 text-sm" })}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-cream-200 px-4 py-6 text-center text-xs font-semibold text-cocoa-400">
        MESS MATE · honest ratings from hostel students
      </footer>
    </div>
  );
}
