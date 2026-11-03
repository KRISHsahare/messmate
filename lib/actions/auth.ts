"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Signs the user out on the server and returns them to the login screen. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
