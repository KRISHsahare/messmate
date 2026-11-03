import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Navbar } from "@/components/layout/navbar";
import { getSession, homeForRole, profileOrDefaults } from "@/lib/auth";

/**
 * Protected shell for every signed-in route.
 * The proxy already blocks anonymous traffic; this is the authoritative check.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = profileOrDefaults(session);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        profile={{ name: profile.name, role: profile.role }}
        homeHref={homeForRole(profile.role)}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pb-12">
        {children}
      </main>
      <BottomNav role={profile.role} />
    </div>
  );
}
