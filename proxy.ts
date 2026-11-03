import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/** Next.js 16 request hook (formerly `middleware`). */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets and image optimisation,
     * so auth cookies stay fresh without slowing down the assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
