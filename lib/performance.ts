import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Small, fixed weight — the quiz is a one-time result, not a recurring KPI.
const QUIZ_SCORE_WEIGHT = 10;

// Recomputes an employee's weighted overall score and current featured badge,
// then writes both onto ts_employees and the public ts_leaderboard projection.
// Called after any KPI, task, badge, or quiz change so the leaderboard stays live.
export async function syncEmployeeAggregates(admin: SupabaseClient, employeeId: string) {
  const [{ data: kpis }, { data: tasks }, { data: quizAttempt }] = await Promise.all([
    admin.from("ts_kpis").select("score, weight").eq("employee_id", employeeId),
    admin
      .from("ts_tasks")
      .select("score, weight")
      .eq("employee_id", employeeId)
      .eq("status", "reviewed")
      .not("score", "is", null),
    admin.from("ts_quiz_attempts").select("score").eq("employee_id", employeeId).maybeSingle(),
  ]);

  const rows = [
    ...(kpis ?? []),
    ...(tasks ?? []),
    ...(quizAttempt ? [{ score: quizAttempt.score, weight: QUIZ_SCORE_WEIGHT }] : []),
  ] as { score: number; weight: number }[];
  const totalWeight = rows.reduce((sum, k) => sum + k.weight, 0);
  const overallScore =
    totalWeight > 0 ? Math.round(rows.reduce((sum, k) => sum + k.score * k.weight, 0) / totalWeight) : 0;

  const { data: latestBadge } = await admin
    .from("ts_employee_badges")
    .select("badge_id, awarded_at, ts_badges(name, icon)")
    .eq("employee_id", employeeId)
    .order("awarded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const badge = latestBadge as { badge_id: string; ts_badges: { name: string; icon: string } | null } | null;

  const { data: employee } = await admin
    .from("ts_employees")
    .update({ overall_score: overallScore, current_badge_id: badge?.badge_id ?? null })
    .eq("id", employeeId)
    .select("full_name, department, role")
    .single();

  // HR/admin accounts live in the same table as employees but shouldn't
  // compete on the leaderboard or Employee of the Month.
  if (employee?.role === "hr") {
    await admin.from("ts_leaderboard").delete().eq("employee_id", employeeId);
    return;
  }

  await admin.from("ts_leaderboard").upsert({
    employee_id: employeeId,
    full_name: employee?.full_name ?? "",
    department: employee?.department ?? null,
    overall_score: overallScore,
    badge_icon: badge?.ts_badges?.icon ?? null,
    badge_title: badge?.ts_badges?.name ?? null,
    updated_at: new Date().toISOString(),
  });
}
