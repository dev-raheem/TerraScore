import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Employee = {
  id: string;
  full_name: string;
  email: string;
  employee_code: string | null;
  department: string | null;
  designation: string | null;
  phone: string | null;
  reporting_manager: string | null;
  joining_date: string | null;
  role: "hr" | "employee";
  must_change_password: boolean;
  status: "pending" | "active";
  overall_score: number;
  current_badge_id: string | null;
};

export const getCurrentEmployee = cache(async (): Promise<Employee | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("ts_employees")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Employee | null) ?? null;
});

// Pages under /admin must call this — the sidebar only *hides* the link for
// non-HR users, it doesn't stop a direct navigation to the URL.
export async function requireHr(): Promise<Employee> {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");
  if (employee.must_change_password) redirect("/change-password");
  if (employee.role !== "hr") redirect("/dashboard");
  return employee;
}
