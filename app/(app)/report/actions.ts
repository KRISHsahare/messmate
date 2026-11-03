"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getSession, profileOrDefaults } from "@/lib/auth";
import { friendlyDbError } from "@/lib/db-errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  REPORT_MAX_LENGTH,
  validateCategory,
  validateText,
} from "@/lib/validation";

export async function submitReport(input: {
  category: string;
  description: string;
}): Promise<ActionResult> {
  const category = validateCategory(input?.category);
  if (!category.ok) return actionError(category.message);

  const description = validateText(input?.description, {
    max: REPORT_MAX_LENGTH,
    label: "a short description",
  });
  if (!description.ok) return actionError(description.message);

  const session = await getSession();
  if (!session) return actionError("Your session expired. Please log in again.");

  const profile = profileOrDefaults(session);
  if (!profile.mess_id) {
    return actionError(
      "Your profile isn't linked to a mess yet. Ask your mess admin to add you.",
    );
  }

  const supabase = await createClient();

  const limited = await checkRateLimit(supabase, "report", session.user.id);
  if (limited) return actionError(limited);

  const { error } = await supabase.from("reports").insert({
    user_id: session.user.id,
    mess_id: profile.mess_id,
    category: category.value,
    description: description.value,
  });

  if (error) {
    return actionError(
      friendlyDbError(error, "We couldn't send your report. Please try again."),
    );
  }

  revalidatePath("/report");

  return actionOk();
}
