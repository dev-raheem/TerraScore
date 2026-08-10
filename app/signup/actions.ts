"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SignUpState = { error?: string } | undefined;

export async function signUp(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  const department = String(formData.get("department") || "").trim() || null;
  const designation = String(formData.get("designation") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!fullName || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "Could not create an account with that email." };
  }

  const { error: insertError } = await admin.from("ts_employees").insert({
    id: created.user.id,
    full_name: fullName,
    email,
    department,
    designation,
    phone,
    role: "employee",
    must_change_password: false,
    status: "pending",
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: `Failed to save account: ${insertError.message}` };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    redirect("/login");
  }

  redirect("/pending-approval");
}
