import { notFound } from "next/navigation";
import { requireHr } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import KpiManager from "./KpiManager";
import KraManager from "./KraManager";
import BadgeManager from "./BadgeManager";
import SnapshotButton from "./SnapshotButton";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireHr();
  const { id } = await params;

  const supabase = await createClient();

  const [{ data: employee }, { data: kpis }, { data: kras }, { data: badges }, { data: earnedBadges }] =
    await Promise.all([
      supabase.from("ts_employees").select("*").eq("id", id).single(),
      supabase.from("ts_kpis").select("*").eq("employee_id", id).order("created_at"),
      supabase.from("ts_kras").select("*").eq("employee_id", id).order("created_at"),
      supabase.from("ts_badges").select("*").order("name"),
      supabase.from("ts_employee_badges").select("badge_id").eq("employee_id", id),
    ]);

  if (!employee) notFound();

  const earnedBadgeIds = (earnedBadges ?? []).map((b) => b.badge_id as string);

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">{employee.full_name}</div>
          <div className="page-sub">
            {[employee.employee_code, employee.department, employee.designation].filter(Boolean).join(" · ") ||
              employee.email}
          </div>
        </div>
        <div className="flex gap10 center">
          <span className="pill pill-primary">Overall score: {employee.overall_score}</span>
          <SnapshotButton employeeId={id} />
        </div>
      </div>

      <div className="grid g2 enter enter-d1" style={{ marginBottom: 18, alignItems: "start" }}>
        <KpiManager employeeId={id} kpis={kpis ?? []} />
        <KraManager employeeId={id} kras={kras ?? []} />
      </div>

      <BadgeManager employeeId={id} badges={badges ?? []} earnedBadgeIds={earnedBadgeIds} />
    </>
  );
}
