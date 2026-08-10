"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertHr } from "@/lib/actions/guard";
import { syncEmployeeAggregates } from "@/lib/performance";

export type ActionState = { error?: string } | undefined;

function revalidateEmployee(employeeId: string) {
  revalidatePath(`/admin/employees/${employeeId}`);
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/kpi");
  revalidatePath("/badges");
  revalidatePath("/performance");
  revalidatePath("/profile");
  revalidatePath("/eom");
}

export async function addKpi(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const employeeId = String(formData.get("employee_id") || "");
  const name = String(formData.get("name") || "").trim();
  const score = Number(formData.get("score"));
  const weight = Number(formData.get("weight"));

  if (!employeeId || !name || Number.isNaN(score) || Number.isNaN(weight)) {
    return { error: "Fill in KPI name, score, and weight." };
  }
  if (score < 0 || score > 100 || weight < 0 || weight > 100) {
    return { error: "Score and weight must be between 0 and 100." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ts_kpis").insert({ employee_id: employeeId, name, score, weight });
  if (error) return { error: error.message };

  await syncEmployeeAggregates(admin, employeeId);
  revalidateEmployee(employeeId);
}

export async function deleteKpi(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const employeeId = String(formData.get("employee_id") || "");
  const kpiId = String(formData.get("kpi_id") || "");
  if (!employeeId || !kpiId) return { error: "Missing KPI." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_kpis").delete().eq("id", kpiId);
  if (error) return { error: error.message };

  await syncEmployeeAggregates(admin, employeeId);
  revalidateEmployee(employeeId);
}

export async function addKra(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const employeeId = String(formData.get("employee_id") || "");
  const name = String(formData.get("name") || "").trim();
  const target = String(formData.get("target") || "").trim();
  const achieved = String(formData.get("achieved") || "").trim();
  const pct = Number(formData.get("pct"));

  if (!employeeId || !name || !target || !achieved || Number.isNaN(pct)) {
    return { error: "Fill in all KRA fields." };
  }
  if (pct < 0 || pct > 100) {
    return { error: "Completion % must be between 0 and 100." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("ts_kras").insert({ employee_id: employeeId, name, target, achieved, pct });
  if (error) return { error: error.message };

  revalidateEmployee(employeeId);
}

export async function deleteKra(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const employeeId = String(formData.get("employee_id") || "");
  const kraId = String(formData.get("kra_id") || "");
  if (!employeeId || !kraId) return { error: "Missing KRA." };

  const admin = createAdminClient();
  const { error } = await admin.from("ts_kras").delete().eq("id", kraId);
  if (error) return { error: error.message };

  revalidateEmployee(employeeId);
}

export async function toggleBadge(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const employeeId = String(formData.get("employee_id") || "");
  const badgeId = String(formData.get("badge_id") || "");
  const award = formData.get("award") === "1";
  if (!employeeId || !badgeId) return { error: "Missing badge." };

  const admin = createAdminClient();
  if (award) {
    const { error } = await admin.from("ts_employee_badges").insert({ employee_id: employeeId, badge_id: badgeId });
    if (error) return { error: error.message };
  } else {
    const { error } = await admin
      .from("ts_employee_badges")
      .delete()
      .eq("employee_id", employeeId)
      .eq("badge_id", badgeId);
    if (error) return { error: error.message };
  }

  await syncEmployeeAggregates(admin, employeeId);
  revalidateEmployee(employeeId);
}

export async function recordMonthlySnapshot(formData: FormData): Promise<ActionState> {
  try {
    await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const employeeId = String(formData.get("employee_id") || "");
  if (!employeeId) return { error: "Missing employee." };

  const admin = createAdminClient();
  const { data: employee } = await admin
    .from("ts_employees")
    .select("overall_score, ts_badges(name)")
    .eq("id", employeeId)
    .single();

  if (!employee) return { error: "Employee not found." };

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const badge = employee.ts_badges as unknown as { name: string } | null;

  const { error } = await admin.from("ts_monthly_scores").upsert(
    {
      employee_id: employeeId,
      month,
      score: employee.overall_score,
      badge_label: badge?.name ?? null,
    },
    { onConflict: "employee_id,month" }
  );

  if (error) return { error: error.message };

  // Recompute this month's top scorer across everyone who has a snapshot for
  // it, so ts_eom_winners (public "Employee of the Month" history) stays
  // correct as more employees get recorded during the month.
  const { data: monthRows } = await admin
    .from("ts_monthly_scores")
    .select("employee_id, score, badge_label, ts_employees(full_name, department)")
    .eq("month", month)
    .order("score", { ascending: false })
    .limit(1);

  const winner = monthRows?.[0] as
    | { employee_id: string; score: number; badge_label: string | null; ts_employees: { full_name: string; department: string | null } | null }
    | undefined;

  if (winner) {
    await admin.from("ts_eom_winners").upsert({
      month,
      employee_id: winner.employee_id,
      full_name: winner.ts_employees?.full_name ?? "",
      department: winner.ts_employees?.department ?? null,
      score: winner.score,
      badge_title: winner.badge_label,
    });
  }

  revalidateEmployee(employeeId);
  revalidatePath("/eom");
}
