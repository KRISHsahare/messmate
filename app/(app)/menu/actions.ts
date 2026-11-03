"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getSession } from "@/lib/auth";
import { friendlyDbError } from "@/lib/db-errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  FEEDBACK_MAX_LENGTH,
  validateMenuId,
  validateStars,
  validateText,
} from "@/lib/validation";

const SESSION_EXPIRED = "Your session expired. Please log in again.";

/** One rating per student per meal; rating again updates the existing row. */
export async function rateMeal(input: {
  menuId: string;
  stars: number;
}): Promise<ActionResult> {
  const menuId = validateMenuId(input?.menuId);
  if (!menuId.ok) return actionError(menuId.message);

  const stars = validateStars(input?.stars);
  if (!stars.ok) return actionError(stars.message);

  const session = await getSession();
  if (!session) return actionError(SESSION_EXPIRED);

  const supabase = await createClient();

  const limited = await checkRateLimit(supabase, "rating", session.user.id);
  if (limited) return actionError(limited);

  const { error } = await supabase.from("ratings").upsert(
    {
      user_id: session.user.id,
      menu_id: menuId.value,
      stars: stars.value,
    },
    { onConflict: "user_id,menu_id" },
  );

  if (error) {
    return actionError(
      friendlyDbError(error, "We couldn't save your rating. Please try again."),
    );
  }

  revalidatePath("/menu");
  revalidatePath("/my-feedback");

  return actionOk();
}

/** Comments attach to the exact meal being described. */
export async function submitFeedback(input: {
  menuId: string;
  comment: string;
}): Promise<ActionResult> {
  const menuId = validateMenuId(input?.menuId);
  if (!menuId.ok) return actionError(menuId.message);

  const comment = validateText(input?.comment, {
    max: FEEDBACK_MAX_LENGTH,
    label: "a comment",
  });
  if (!comment.ok) return actionError(comment.message);

  const session = await getSession();
  if (!session) return actionError(SESSION_EXPIRED);

  const supabase = await createClient();

  const limited = await checkRateLimit(supabase, "feedback", session.user.id);
  if (limited) return actionError(limited);

  const { error } = await supabase.from("feedback").insert({
    user_id: session.user.id,
    menu_id: menuId.value,
    comment: comment.value,
  });

  if (error) {
    return actionError(
      friendlyDbError(error, "We couldn't save your feedback. Please try again."),
    );
  }

  revalidatePath("/menu");
  revalidatePath("/my-feedback");

  return actionOk();
}
