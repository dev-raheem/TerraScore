"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertHr } from "@/lib/actions/guard";

export type ActionState = { error?: string } | undefined;

function revalidateBadges() {
  revalidatePath("/badges");
  revalidatePath("/admin/employees");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/eom");
  revalidatePath("/leaderboard");
}

export async function addBadge(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name || !icon || !description) {
    return { error: "Fill in badge name, icon, and description." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ts_badges").insert({ name, icon, description });
  if (error) {
    if (error.code === "23505") return { error: "A badge with that name already exists." };
    return { error: error.message };
  }

  revalidateBadges();
}

export async function updateBadge(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const badgeId = String(formData.get("badge_id") || "");
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!badgeId || !name || !icon || !description) {
    return { error: "Fill in badge name, icon, and description." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ts_badges").update({ name, icon, description }).eq("id", badgeId);
  if (error) {
    if (error.code === "23505") return { error: "A badge with that name already exists." };
    return { error: error.message };
  }

  revalidateBadges();
}

export async function deleteBadge(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const badgeId = String(formData.get("badge_id") || "");
  if (!badgeId) return { error: "Missing badge." };

  const admin = createAdminClient();
  // Employees currently featuring this badge on their profile need that
  // pointer cleared first — ts_employees.current_badge_id has no ON DELETE
  // action, so the delete below would otherwise fail with a FK violation.
  // ts_employee_badges (award history) cascades on delete automatically.
  await admin.from("ts_employees").update({ current_badge_id: null }).eq("current_badge_id", badgeId);

  const { error } = await admin.from("ts_badges").delete().eq("id", badgeId);
  if (error) return { error: error.message };

  revalidateBadges();
}
