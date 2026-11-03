import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminTabs } from "@/components/admin/admin-tabs";
import { getSession, profileOrDefaults } from "@/lib/auth";

export const metadata = { title: "Admin console" };

/**
 * Authoritative administrator guard. The proxy only checks that somebody is
 * signed in; this layout checks *who*. Students never see these pages even if
 * they type the URL, and every server action re-checks the role as well.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = profileOrDefaults(session);
  if (profile.role !== "admin") redirect("/menu");

  return (
    <div className="space-y-5">
      <AdminTabs />
      {children}
    </div>
  );
}
