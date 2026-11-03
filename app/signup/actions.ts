"use server";

import { redirect } from "next/navigation";

import { homeForRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AuthState } from "@/app/login/actions";

function friendlySignupError(message: string) {
  const normalised = message.toLowerCase();

  if (normalised.includes("already registered") || normalised.includes("already been registered")) {
    return "That email is already registered. Try logging in instead.";
  }
  if (normalised.includes("password")) {
    return "Please choose a password with at least 8 characters.";
  }
  if (normalised.includes("rate limit") || normalised.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return "We couldn't create your account. Please try again.";
}

export async function signup(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (name.length < 2) {
    return { error: "Please tell us your name." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Passwords need at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Those passwords don't match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return { error: friendlySignupError(error.message) };
  }

  // Email confirmation turned on: no session until the link is clicked.
  if (!data.session || !data.user) {
    return {
      success:
        "Almost there! Check your inbox and confirm your email, then log in.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(homeForRole(profile?.role));
}
