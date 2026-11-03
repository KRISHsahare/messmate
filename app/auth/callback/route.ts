import { NextResponse, type NextRequest } from "next/server";

import { homeForRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-confirmation / magic-link callback.
 * Exchanges the PKCE code for a session and sends the user to their home page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : null;

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = "/menu";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    destination = homeForRole(profile?.role);
  }

  return NextResponse.redirect(`${origin}${next ?? destination}`);
}
