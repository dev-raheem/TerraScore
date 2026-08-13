import type { Metadata } from "next";
import Link from "next/link";
import BarMini from "@/components/BarMini";
import { requireHr } from "@/lib/session";
import { getLeaderboard } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };

const quickActions: [string, string, string?][] = [
  ["👥", "Manage Employees", "/admin/employees"],
  ["🎯", "Create KPI", "/admin/employees"],
  ["📋", "Create KRA", "/admin/employees"],
  ["⚖️", "Award a Badge", "/admin/employees"],
];

export default async function AdminPage() {
  await requireHr();

  const supabase = await createClient();
  const [leaderboard, { data: recentEmployees }] = await Promise.all([
    getLeaderboard(),
    supabase
      .from("ts_employees")
      .select("id, full_name, department, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const employeeCount = leaderboard.length;
  const avgScore = employeeCount
    ? Math.round((leaderboard.reduce((sum, e) => sum + e.overall_score, 0) / employeeCount) * 10) / 10
    : 0;

  const deptTotals = new Map<string, { sum: number; count: number }>();
  for (const e of leaderboard) {
    const dept = e.department ?? "Unassigned";
    const cur = deptTotals.get(dept) ?? { sum: 0, count: 0 };
    cur.sum += e.overall_score;
    cur.count += 1;
    deptTotals.set(dept, cur);
  }
  const deptAverages = [...deptTotals.entries()]
    .map(([dept, { sum, count }]) => [dept, Math.round(sum / count)] as const)
    .sort((a, b) => b[1] - a[1]);
  const topDept = deptAverages[0]?.[0] ?? "—";

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">HR Admin Dashboard</div>
          <div className="page-sub">Company-wide controls · visible to HR & managers only</div>
        </div>
        <span className="pill pill-coral">🔒 Admin access</span>
      </div>

      <div className="grid g4 enter enter-d1" style={{ marginBottom: 18 }}>
        <div className="card pad flex col gap6"><div className="tiny muted bold">EMPLOYEES</div><div className="mono display" style={{ fontSize: 24 }}>{employeeCount}</div></div>
        <div className="card pad flex col gap6"><div className="tiny muted bold">AVG COMPANY SCORE</div><div className="mono display" style={{ fontSize: 24 }}>{avgScore}</div></div>
        <div className="card pad flex col gap6"><div className="tiny muted bold">TOP DEPARTMENT</div><div className="mono display" style={{ fontSize: 24 }}>{topDept}</div></div>
        <div className="card pad flex col gap6"><div className="tiny muted bold">LEADERBOARD</div><div className="mono display" style={{ fontSize: 24 }}>Live</div></div>
      </div>

      <div className="bold" style={{ marginBottom: 12 }}>Quick actions</div>
      <div className="grid g4 enter enter-d2" style={{ marginBottom: 22 }}>
        {quickActions.map(([icon, label, href]) =>
          href ? (
            <Link key={label} href={href} className="card pad flex col gap8">
              <div className="icon-box" style={{ background: "var(--primary-soft)", fontSize: 17 }}>{icon}</div>
              <div className="small bold">{label}</div>
            </Link>
          ) : (
            <button key={label} className="card pad flex col gap8" style={{ textAlign: "left" }}>
              <div className="icon-box" style={{ background: "var(--primary-soft)", fontSize: 17 }}>{icon}</div>
              <div className="small bold">{label}</div>
            </button>
          )
        )}
      </div>

      <div className="grid g12-8-4 enter enter-d3">
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 12 }}>Department analytics — avg score</div>
          {deptAverages.length === 0 ? (
            <div className="muted small">No scores recorded yet.</div>
          ) : (
            deptAverages.map(([dept, value]) => (
              <div key={dept} className="flex center gap12" style={{ marginBottom: 10 }}>
                <div className="small" style={{ width: 100 }}>{dept}</div>
                <div style={{ flex: 1 }}><BarMini pct={value} /></div>
                <div className="mono small" style={{ width: 30, textAlign: "right" }}>{value}</div>
              </div>
            ))
          )}
        </div>
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 12 }}>Recently added employees</div>
          {(!recentEmployees || recentEmployees.length === 0) && (
            <div className="muted small">No employees yet.</div>
          )}
          {(recentEmployees ?? []).map((e) => (
            <div key={e.id} className="small" style={{ padding: "8px 0", borderTop: "1px solid var(--border)" }}>
              {e.full_name}
              <span className="muted"> · {e.department ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
