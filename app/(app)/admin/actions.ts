"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getSession, profileOrDefaults } from "@/lib/auth";
import { friendlyDbError } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import {
  isReportStatus,
  validateMealType,
  validateMenuDate,
  validateMenuItems,
  validatePrice,
} from "@/lib/validation";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Session + role check shared by every administrator action. */
async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, message: "Your session expired. Please log in again." };
  }

  const profile = profileOrDefaults(session);
  if (profile.role !== "admin") {
    return { ok: false as const, message: "Only the mess administrator can do that." };
  }

  return { ok: true as const, session, profile };
}

function revalidateAdmin(feedsStudents: boolean) {
  revalidatePath("/admin");
  revalidatePath("/admin/menu");
  revalidatePath("/admin/feedback");
  revalidatePath("/admin/reports");
  if (feedsStudents) {
    revalidatePath("/menu");
    revalidatePath("/messes");
  }
}

/** Creates or replaces one meal's menu for a date. */
export async function saveMenu(input: {
  date: string;
  mealType: string;
  items: string[];
}): Promise<ActionResult> {
  const date = validateMenuDate(input?.date);
  if (!date.ok) return actionError(date.message);

  const mealType = validateMealType(input?.mealType);
  if (!mealType.ok) return actionError(mealType.message);

  const items = validateMenuItems(input?.items);
  if (!items.ok) return actionError(items.message);

  const admin = await requireAdmin();
  if (!admin.ok) return actionError(admin.message);

  if (!admin.profile.mess_id) {
    return actionError("Your profile isn't linked to a mess yet, so there is no menu to edit.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("menus").upsert(
    {
      mess_id: admin.profile.mess_id,
      date: date.value,
      meal_type: mealType.value,
      items: items.value,
    },
    { onConflict: "mess_id,date,meal_type" },
  );

  if (error) {
    return actionError(friendlyDbError(error, "We couldn't save that menu. Please try again."));
  }

  revalidateAdmin(true);
  return actionOk();
}

/** Removes a published meal so students see nothing for it that day. */
export async function deleteMenu(input: {
  date: string;
  mealType: string;
}): Promise<ActionResult> {
  const date = validateMenuDate(input?.date);
  if (!date.ok) return actionError(date.message);

  const mealType = validateMealType(input?.mealType);
  if (!mealType.ok) return actionError(mealType.message);

  const admin = await requireAdmin();
  if (!admin.ok) return actionError(admin.message);
  if (!admin.profile.mess_id) return actionError("No mess is linked to your profile yet.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("menus")
    .delete()
    .eq("mess_id", admin.profile.mess_id)
    .eq("date", date.value)
    .eq("meal_type", mealType.value);

  if (error) {
    return actionError(friendlyDbError(error, "We couldn't delete that menu. Please try again."));
  }

  revalidateAdmin(true);
  return actionOk();
}

/** Moves a report along its open → in progress → resolved lifecycle. */
export async function updateReportStatus(input: {
  reportId: string;
  status: string;
}): Promise<ActionResult> {
  if (typeof input?.reportId !== "string" || !UUID_PATTERN.test(input.reportId)) {
    return actionError("That report no longer exists. Refresh the page and try again.");
  }
  if (!isReportStatus(input?.status)) {
    return actionError("Pick a valid status for this report.");
  }

  const admin = await requireAdmin();
  if (!admin.ok) return actionError(admin.message);

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({ status: input.status })
    .eq("id", input.reportId);

  if (error) {
    return actionError(friendlyDbError(error, "We couldn't update that report. Please try again."));
  }

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  revalidatePath("/report");
  return actionOk();
}

/** Updates the headline price shown on the public directory. */
export async function updateMessPrice(input: {
  price: number | string;
}): Promise<ActionResult> {
  const price = validatePrice(input?.price);
  if (!price.ok) return actionError(price.message);

  const admin = await requireAdmin();
  if (!admin.ok) return actionError(admin.message);
  if (!admin.profile.mess_id) return actionError("No mess is linked to your profile yet.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("messes")
    .update({ price_per_meal: price.value })
    .eq("id", admin.profile.mess_id);

  if (error) {
    return actionError(friendlyDbError(error, "We couldn't save that price. Please try again."));
  }

  revalidatePath("/admin/menu");
  revalidatePath("/messes");
  return actionOk();
}
