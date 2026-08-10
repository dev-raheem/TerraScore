"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ChangePasswordState = { error?: string } | undefined;

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    return { error: updateError.message };
  }

  // RLS has no client update policy on ts_employees by design — clear the
  // flag with the service-role client now that the password change succeeded.
  const admin = createAdminClient();
  const { data: employee, error: dbError } = await admin
    .from("ts_employees")
    .update({ must_change_password: false })
    .eq("id", user.id)
    .select("role")
    .single();

  if (dbError || !employee) {
    return { error: "Password updated, but we couldn't finish setup. Contact HR." };
  }

  redirect(employee.role === "hr" ? "/admin" : "/dashboard");
}
