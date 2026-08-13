import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BarMini from "@/components/BarMini";
import { getCurrentEmployee } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "KPIs & KRAs" };

export default async function KpiPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const [{ data: kras }, { data: kpis }] = await Promise.all([
    supabase.from("ts_kras").select("*").eq("employee_id", employee.id).order("created_at"),
    supabase.from("ts_kpis").select("*").eq("employee_id", employee.id).order("created_at"),
  ]);

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">KPI & KRA Analytics</div>
          <div className="page-sub">{employee.department ?? "—"} · Current cycle</div>
        </div>
      </div>

      <div className="grid g2 enter enter-d1" style={{ marginBottom: 18 }}>
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 10 }}>Key Result Areas (KRA)</div>
          <table>
            <thead>
              <tr>
                <th>KRA</th>
                <th>Target</th>
                <th>Achieved</th>
                <th>Completion</th>
              </tr>
            </thead>
            <tbody>
              {(kras ?? []).map((k) => (
                <tr key={k.id}>
                  <td className="small">{k.name}</td>
                  <td className="mono">{k.target}</td>
                  <td className="mono">{k.achieved}</td>
                  <td style={{ width: 160 }}>
                    <div className="flex center gap8">
                      <BarMini pct={k.pct} color={k.pct > 90 ? "linear-gradient(90deg,#189267,#3FBF8F)" : undefined} />
                      <span className="tiny mono">{k.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {(!kras || kras.length === 0) && (
                <tr>
                  <td colSpan={4} className="muted small" style={{ padding: 14, textAlign: "center" }}>
                    No KRAs set yet. Ask HR to add them.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 10 }}>Key Performance Indicators (KPI)</div>
          <table>
            <thead>
              <tr>
                <th>KPI</th>
                <th>Score</th>
                <th>Weight</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {(kpis ?? []).map((k) => (
                <tr key={k.id}>
                  <td className="small">{k.name}</td>
                  <td className="mono bold">{k.score}</td>
                  <td className="mono">{k.weight}%</td>
                  <td style={{ width: 160 }}>
                    <BarMini pct={k.score} />
                  </td>
                </tr>
              ))}
              {(!kpis || kpis.length === 0) && (
                <tr>
                  <td colSpan={4} className="muted small" style={{ padding: 14, textAlign: "center" }}>
                    No KPIs set yet. Ask HR to add them.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
