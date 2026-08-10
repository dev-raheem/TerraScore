"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return { error: "Invalid email or password." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employee } = await supabase
    .from("ts_employees")
    .select("role, must_change_password, status")
    .eq("id", user!.id)
    .single();

  if (!employee) {
    await supabase.auth.signOut();
    return { error: "No employee record found for this account. Contact HR." };
  }

  if (employee.must_change_password) {
    redirect("/change-password");
  }

  if (employee.status === "pending") {
    redirect("/pending-approval");
  }

  redirect(employee.role === "hr" ? "/admin" : "/dashboard");
}
