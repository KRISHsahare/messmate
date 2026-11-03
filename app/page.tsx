import { redirect } from "next/navigation";

import { getSession, homeForRole } from "@/lib/auth";

/** Entry point: send each visitor to the right home for their role. */
export default async function IndexPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(homeForRole(session.profile?.role));
}
