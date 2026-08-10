import { redirect } from "next/navigation";
import Ring from "@/components/Ring";
import LineChart from "@/components/LineChart";
import BarMini from "@/components/BarMini";
import { getCurrentEmployee } from "@/lib/session";
import { getLeaderboard } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";

export default async function PerformancePage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const [leaderboard, { data: kpis }, { data: kras }, { data: monthly }] = await Promise.all([
    getLeaderboard(),
    supabase.from("ts_kpis").select("*").eq("employee_id", employee.id).order("created_at"),
    supabase.from("ts_kras").select("*").eq("employee_id", employee.id).order("created_at"),
    supabase.from("ts_monthly_scores").select("*").eq("employee_id", employee.id).order("month"),
  ]);

  const companyRank = leaderboard.findIndex((e) => e.employee_id === employee.id) + 1;
  const sameDept = leaderboard.filter((e) => e.department === employee.department);
  const deptRank = sameDept.findIndex((e) => e.employee_id === employee.id) + 1;

  const kpiList = kpis ?? [];
  const kraList = kras ?? [];
  const kraAvg = kraList.length ? Math.round(kraList.reduce((s, k) => s + k.pct, 0) / kraList.length) : null;

  const sortedKpis = [...kpiList].sort((a, b) => b.score - a.score);
  const strengths = sortedKpis.slice(0, 2);
  const improvements = sortedKpis.length > 2 ? sortedKpis.slice(-2).reverse() : [];

  const history = monthly ?? [];
  const chartLabels = history.map((m) => new Date(m.month).toLocaleDateString("en-US", { month: "short" }));
  const chartData = history.map((m) => m.score);

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">My Performance</div>
          <div className="page-sub">Only visible to you — your manager and HR admin</div>
        </div>
      </div>

      <div className="grid g12-8-4 enter enter-d1" style={{ alignItems: "stretch", marginBottom: 18 }}>
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 6 }}>Monthly progress</div>
          <div className="tiny muted" style={{ marginBottom: 10 }}>Overall score trend</div>
          {chartData.length >= 2 ? (
            <LineChart data={chartData} labels={chartLabels} width={560} height={180} color="#043C40" />
          ) : (
            <div className="muted small" style={{ padding: "30px 0", textAlign: "center" }}>
              Not enough history yet — check back after HR records a couple of monthly snapshots.
            </div>
          )}
        </div>
        <div className="card pad-lg flex col center" style={{ textAlign: "center" }}>
          <Ring percent={employee.overall_score} size={140} strokeWidth={12} colors={["#043C40", "#0E6B73"]} center={employee.overall_score} sub="Overall score" />
          <div className="flex gap16" style={{ marginTop: 16 }}>
            <div>
              <div className="mono bold">{companyRank > 0 ? `#${companyRank}` : "—"}</div>
              <div className="tiny muted">Rank</div>
            </div>
            <div>
              <div className="mono bold">{deptRank > 0 ? `#${deptRank}` : "—"}</div>
              <div className="tiny muted">Dept rank</div>
            </div>
          </div>
        </div>
      </div>

      {kpiList.length > 0 && (
        <div className="grid g5 enter enter-d2" style={{ marginBottom: 18 }}>
          {kpiList.slice(0, 5).map((k) => (
            <div key={k.id} className="card pad flex col center gap6" style={{ textAlign: "center" }}>
              <Ring percent={k.score} size={86} strokeWidth={8} colors={["#043C40", "#0E6B73"]} center={k.score} />
              <div className="tiny muted bold" style={{ marginTop: 2 }}>{k.name}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid g2 enter enter-d3" style={{ marginBottom: 18 }}>
        <div className="card pad-lg">
          {strengths.length > 0 ? (
            <>
              <div className="bold" style={{ marginBottom: 12 }}>Top strengths</div>
              {strengths.map((k) => (
                <div key={k.id} className="flex gap10" style={{ marginBottom: 10 }}>
                  <span className="pill pill-emerald tiny">✓</span>
                  <span className="small">{k.name} — {k.score}</span>
                </div>
              ))}
              {improvements.length > 0 && (
                <>
                  <div className="divider" />
                  <div className="bold" style={{ marginBottom: 12 }}>Areas to improve</div>
                  {improvements.map((k) => (
                    <div key={k.id} className="flex gap10" style={{ marginBottom: 10 }}>
                      <span className="pill pill-coral tiny">!</span>
                      <span className="small">{k.name} — {k.score}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="muted small">No KPIs set yet — ask HR to add them.</div>
          )}
        </div>
        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 12 }}>KRA achievement</div>
          {kraAvg !== null ? (
            <>
              <div className="mono bold" style={{ fontSize: 22, marginBottom: 8 }}>{kraAvg}%</div>
              <BarMini pct={kraAvg} color={kraAvg > 90 ? "linear-gradient(90deg,#189267,#3FBF8F)" : undefined} />
            </>
          ) : (
            <div className="muted small">No KRAs set yet — ask HR to add them.</div>
          )}
        </div>
      </div>

      <div className="card pad-lg enter enter-d4">
        <div className="bold" style={{ marginBottom: 12 }}>Score history</div>
        {history.length === 0 ? (
          <div className="muted small">No monthly history recorded yet.</div>
        ) : (
          history.map((m) => (
            <div key={m.id} className="flex between center" style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
              <div className="small bold" style={{ width: 110 }}>
                {new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
              <div className="mono" style={{ width: 50 }}>{m.score}</div>
              <div style={{ flex: 1 }}>
                <BarMini pct={m.score} />
              </div>
              <div className="small muted" style={{ width: 170, textAlign: "right" }}>{m.badge_label ?? "—"}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
