"use server";

import { redirect } from "next/navigation";

import { homeForRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  success?: string;
};

/** Only allow same-origin relative paths in ?next=. */
function safeRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function friendlyLoginError(message: string) {
  const normalised = message.toLowerCase();

  if (normalised.includes("invalid login credentials")) {
    return "That email and password don't match our records.";
  }
  if (normalised.includes("email not confirmed")) {
    return "Please confirm your email address first — check your inbox.";
  }
  if (normalised.includes("rate limit") || normalised.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return "We couldn't sign you in. Please try again.";
}

export async function login(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: friendlyLoginError(error?.message ?? "") };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const next = safeRedirectPath(formData.get("next"));
  redirect(next ?? homeForRole(profile?.role));
}
