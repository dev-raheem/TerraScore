"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertHr } from "@/lib/actions/guard";

export type AddEmployeeState =
  | { error: string; tempPassword?: undefined; email?: undefined }
  | { error?: undefined; tempPassword: string; email: string }
  | undefined;

const TEMP_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

function generateTempPassword(length = 12) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_CHARS[Math.floor(Math.random() * TEMP_PASSWORD_CHARS.length)];
  }
  return out;
}

export async function addEmployee(_prevState: AddEmployeeState, formData: FormData): Promise<AddEmployeeState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const employeeCode = String(formData.get("employee_code") || "").trim() || null;
  const department = String(formData.get("department") || "").trim() || null;
  const designation = String(formData.get("designation") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const reportingManager = String(formData.get("reporting_manager") || "").trim() || null;
  const joiningDate = String(formData.get("joining_date") || "").trim() || null;

  if (!fullName || !email) {
    return { error: "Name and email are required." };
  }

  const tempPassword = generateTempPassword();
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Failed to create the account." };
  }

  const { error: insertError } = await admin.from("ts_employees").insert({
    id: created.user.id,
    full_name: fullName,
    email,
    employee_code: employeeCode,
    department,
    designation,
    phone,
    reporting_manager: reportingManager,
    joining_date: joiningDate,
    role: "employee",
    must_change_password: true,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: `Failed to save employee record: ${insertError.message}` };
  }

  revalidatePath("/admin/employees");
  return { tempPassword, email };
}

export type SimpleActionState = { error?: string } | undefined;

export async function approveEmployee(formData: FormData): Promise<SimpleActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing employee." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_employees").update({ status: "active" }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
}

export async function rejectEmployee(formData: FormData): Promise<SimpleActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing employee." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  revalidatePath("/admin/employees");
}
