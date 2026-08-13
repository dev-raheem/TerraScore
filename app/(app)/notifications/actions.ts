"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { assertHr } from "@/lib/actions/guard";
import { getCurrentEmployee } from "@/lib/session";

export type ActionState = { error?: string } | undefined;

export async function sendNotification(formData: FormData): Promise<ActionState> {
  let hrId: string;
  try {
    hrId = await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const audience = String(formData.get("audience") || "");
  const employeeId = String(formData.get("employee_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (audience !== "all" && audience !== "employee") return { error: "Choose who this notification is for." };
  if (audience === "employee" && !employeeId) return { error: "Choose an employee." };
  if (!title) return { error: "Title is required." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_notifications").insert({
    title,
    message: message || null,
    audience,
    employee_id: audience === "employee" ? employeeId : null,
    created_by: hrId,
  });
  if (error) return { error: error.message };

  revalidatePath("/notifications");
}

export async function deleteNotification(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const notificationId = String(formData.get("notification_id") || "");
  if (!notificationId) return { error: "Missing notification." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_notifications").delete().eq("id", notificationId);
  if (error) return { error: error.message };

  revalidatePath("/notifications");
}

export async function markNotificationRead(formData: FormData): Promise<ActionState> {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated." };

  const notificationId = String(formData.get("notification_id") || "");
  if (!notificationId) return { error: "Missing notification." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("ts_notification_reads")
    .upsert({ notification_id: notificationId, employee_id: employee.id }, { onConflict: "notification_id,employee_id" });
  if (error) return { error: error.message };

  revalidatePath("/notifications");
}

export async function markAllRead(): Promise<ActionState> {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: visible } = await supabase
    .from("ts_notifications")
    .select("id")
    .or(`audience.eq.all,employee_id.eq.${employee.id}`);

  const ids = (visible ?? []).map((n) => n.id as string);
  if (ids.length === 0) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("ts_notification_reads")
    .upsert(
      ids.map((id) => ({ notification_id: id, employee_id: employee.id })),
      { onConflict: "notification_id,employee_id" }
    );
  if (error) return { error: error.message };

  revalidatePath("/notifications");
}
