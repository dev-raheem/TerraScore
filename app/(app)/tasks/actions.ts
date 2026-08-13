"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/session";

export type ActionState = { error?: string } | undefined;

export async function completeTask(formData: FormData): Promise<ActionState> {
  const employee = await getCurrentEmployee();
  if (!employee) return { error: "Not authenticated." };

  const taskId = String(formData.get("task_id") || "");
  const note = String(formData.get("note") || "").trim();
  if (!taskId) return { error: "Missing task." };

  const admin = createAdminClient();
  const { data: task } = await admin.from("ts_tasks").select("employee_id, status").eq("id", taskId).single();
  if (!task || task.employee_id !== employee.id) return { error: "Task not found." };
  if (task.status === "completed" || task.status === "reviewed") {
    return { error: "This task is already marked complete." };
  }

  const { error } = await admin
    .from("ts_tasks")
    .update({ status: "completed", employee_note: note || null, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/tasks");
}
