import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/session";
import { getLeaderboard } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/data";
import Celebrate from "./Celebrate";

export default async function EomPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const leaderboard = await getLeaderboard();
  const topScorer = leaderboard[0];

  const supabase = await createClient();
  const { data: winners } = await supabase
    .from("ts_eom_winners")
    .select("*")
    .order("month", { ascending: false })
    .limit(5);

  const history = winners ?? [];
  const pastWinners = history.slice(1, 5);
  const monthsOnTop = topScorer ? history.filter((w) => w.employee_id === topScorer.employee_id).length : 0;

  if (!topScorer) {
    return (
      <div className="page-head enter">
        <div>
          <div className="page-title">Employee of the Month</div>
          <div className="page-sub">No scores recorded yet — add KPIs for at least one employee to see this.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Employee of the Month</div>
          <div className="page-sub">Auto-calculated from live KPI performance</div>
        </div>
        <Celebrate auto />
      </div>

      <div
        className="card pad-lg enter enter-d1"
        style={{ background: "linear-gradient(150deg,#021F21,#043C40 50%,#0E6B73)", color: "#fff", position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", width: 300, height: 300, background: "rgba(255,255,255,.1)", borderRadius: "50%", top: -120, right: -100 }} />
        <div style={{ position: "absolute", width: 200, height: 200, background: "rgba(255,255,255,.08)", borderRadius: "50%", bottom: -80, left: "20%" }} />
        <div className="flex between wrap" style={{ gap: 24, position: "relative" }}>
          <div className="flex gap20 center">
            <div className="avatar" style={{ width: 110, height: 110, fontSize: 38, background: "rgba(255,255,255,.22)", border: "3px solid rgba(255,255,255,.45)" }}>
              {initials(topScorer.full_name)}
            </div>
            <div>
              <span className="pill" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>🏆 Employee of the Month</span>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 10 }}>{topScorer.full_name}</div>
              <div style={{ opacity: 0.85 }}>{topScorer.department ?? "—"}</div>
              {topScorer.badge_title && (
                <div className="flex gap8 wrap" style={{ marginTop: 12 }}>
                  <span className="pill" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>
                    {topScorer.badge_icon} {topScorer.badge_title}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap16">
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 28, fontWeight: 800 }}>{topScorer.overall_score}</div>
              <div className="tiny" style={{ opacity: 0.8 }}>Overall score</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 28, fontWeight: 800 }}>#1</div>
              <div className="tiny" style={{ opacity: 0.8 }}>Company rank</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 28, fontWeight: 800 }}>{monthsOnTop}</div>
              <div className="tiny" style={{ opacity: 0.8 }}>Months as EOM</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card pad-lg enter enter-d3" style={{ marginTop: 18 }}>
        <div className="bold" style={{ marginBottom: 12 }}>Past winners</div>
        {pastWinners.length === 0 ? (
          <div className="muted small">No past winners recorded yet.</div>
        ) : (
          <div className="grid g4">
            {pastWinners.map((w) => (
              <div key={w.month} className="card-flat pad flex col center gap8" style={{ textAlign: "center" }}>
                <div className="avatar" style={{ width: 44, height: 44, background: "var(--primary)" }}>
                  {initials(w.full_name)}
                </div>
                <div className="bold small">{w.full_name}</div>
                <div className="tiny muted">
                  {new Date(w.month).toLocaleDateString("en-US", { month: "long" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
