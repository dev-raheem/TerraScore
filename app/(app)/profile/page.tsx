import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Ring from "@/components/Ring";
import { initials } from "@/lib/data";
import { getCurrentEmployee } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const [{ data: earnedBadges }, { data: monthly }] = await Promise.all([
    supabase.from("ts_employee_badges").select("ts_badges(name, icon)").eq("employee_id", employee.id),
    supabase.from("ts_monthly_scores").select("*").eq("employee_id", employee.id).order("month"),
  ]);

  const badges = (earnedBadges ?? [])
    .map((b) => b.ts_badges as unknown as { name: string; icon: string } | null)
    .filter((b): b is { name: string; icon: string } => b !== null);

  const history = monthly ?? [];

  const subtitle = [employee.employee_code, employee.department, employee.designation]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">My Profile</div>
          <div className="page-sub">Your professional record on TerraScore</div>
        </div>
      </div>

      <div className="grid g12-8-4 enter enter-d1" style={{ marginBottom: 18 }}>
        <div className="card pad-lg flex gap20" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
          <div className="avatar" style={{ width: 88, height: 88, fontSize: 30, background: "linear-gradient(135deg,var(--primary),var(--primary-2))" }}>
            {initials(employee.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{employee.full_name}</div>
            <div className="muted small">{subtitle || "—"}</div>
            <div className="divider" />
            <div className="grid g2" style={{ gap: 10, fontSize: 13 }}>
              <div className="flex gap8 center"><span className="faint">Reporting Manager</span></div><div className="small bold">{employee.reporting_manager ?? "—"}</div>
              <div className="flex gap8 center"><span className="faint">Joining Date</span></div><div className="small bold">{employee.joining_date ?? "—"}</div>
              <div className="flex gap8 center"><span className="faint">Email</span></div><div className="small bold">{employee.email}</div>
              <div className="flex gap8 center"><span className="faint">Phone</span></div><div className="small bold">{employee.phone ?? "—"}</div>
            </div>
          </div>
        </div>
        <div className="card pad-lg flex col center" style={{ textAlign: "center" }}>
          <Ring percent={employee.overall_score} size={110} strokeWidth={10} center={employee.overall_score} />
          <div className="tiny muted" style={{ marginTop: 8 }}>Overall score</div>
        </div>
      </div>

      <div className="grid g2 enter enter-d2">
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 12 }}>Badges & titles earned</div>
          {badges.length === 0 ? (
            <div className="muted small">No badges earned yet.</div>
          ) : (
            <div className="flex gap10 wrap">
              {badges.map((b) => (
                <span key={b.name} className="pill pill-gold">
                  {b.icon} {b.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 6 }}>Performance history</div>
          {history.length === 0 ? (
            <div className="muted small">No monthly history recorded yet.</div>
          ) : (
            history.map((m) => (
              <div key={m.id} className="flex between center" style={{ padding: "9px 0", borderTop: "1px solid var(--border)" }}>
                <div className="small bold" style={{ width: 100 }}>
                  {new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                <div className="mono small" style={{ width: 40 }}>{m.score}</div>
                <div className="small muted" style={{ flex: 1 }}>{m.badge_label ?? "No badge this month"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
