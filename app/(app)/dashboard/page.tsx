import { redirect } from "next/navigation";
import Link from "next/link";
import Ring from "@/components/Ring";
import { getCurrentEmployee } from "@/lib/session";
import { getLeaderboard } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/data";

export default async function DashboardPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const [leaderboard, { count: totalEmployees }] = await Promise.all([
    getLeaderboard(),
    supabase.from("ts_employees").select("id", { count: "exact", head: true }),
  ]);

  const myRank = leaderboard.findIndex((e) => e.employee_id === employee.id) + 1;
  const topScorer = leaderboard[0];
  const firstName = employee.full_name.split(" ")[0];

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Good day, {firstName} 👋</div>
          <div className="page-sub">Here&apos;s how TerraScore looks across the company today.</div>
        </div>
        <Link href="/performance" className="btn btn-primary btn-sm">
          View my performance →
        </Link>
      </div>

      <div className="grid g2 enter enter-d1" style={{ marginBottom: 18 }}>
        <div className="card pad flex col gap8">
          <div className="tiny muted bold">TOTAL EMPLOYEES</div>
          <div className="mono display" style={{ fontSize: 26 }}>{totalEmployees ?? 0}</div>
        </div>
        <div className="card pad flex col gap8">
          <div className="tiny muted bold">YOUR CURRENT RANK</div>
          <div className="mono display" style={{ fontSize: 26 }}>{myRank > 0 ? `#${myRank}` : "—"}</div>
        </div>
      </div>

      <div className="grid g12-8-4 enter enter-d2" style={{ marginBottom: 18, alignItems: "stretch" }}>
        {topScorer ? (
          <Link
            href="/eom"
            className="card pad-lg"
            style={{
              background: "linear-gradient(135deg,#021F21,#043C40 55%,#0E6B73)",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            <div style={{ position: "absolute", width: 220, height: 220, background: "rgba(255,255,255,.12)", borderRadius: "50%", top: -80, right: -60 }} />
            <span className="pill" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>🏆 Current top scorer</span>
            <div className="flex center gap16" style={{ marginTop: 20 }}>
              <div className="avatar" style={{ width: 74, height: 74, fontSize: 26, background: "rgba(255,255,255,.22)", border: "2px solid rgba(255,255,255,.4)" }}>
                {initials(topScorer.full_name)}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{topScorer.full_name}</div>
                <div style={{ opacity: 0.85, fontSize: 13.5 }}>{topScorer.department ?? "—"}</div>
                <div className="flex gap8" style={{ marginTop: 8 }}>
                  <span className="pill" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>Score {topScorer.overall_score}</span>
                  {topScorer.badge_title && (
                    <span className="pill" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>
                      {topScorer.badge_icon} {topScorer.badge_title}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="btn btn-sm" style={{ background: "rgba(255,255,255,.18)", color: "#fff", marginTop: 16, width: "fit-content" }}>
              View full story →
            </div>
          </Link>
        ) : (
          <div className="card pad-lg flex col center" style={{ justifyContent: "center", textAlign: "center" }}>
            <div className="muted small">No scores recorded yet.</div>
          </div>
        )}
        <div className="card pad-lg flex col" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div className="tiny muted bold" style={{ marginBottom: 10 }}>YOUR OVERALL SCORE</div>
          <Ring percent={employee.overall_score} size={150} strokeWidth={13} colors={["#043C40", "#0E6B73"]} center={employee.overall_score} sub="/ 100" />
        </div>
      </div>

      <div className="card pad-lg enter enter-d3">
        <div className="flex between center" style={{ marginBottom: 14 }}>
          <div>
            <div className="bold" style={{ fontSize: 16 }}>Company Leaderboard</div>
            <div className="tiny muted">Every employee can see the full ranking, live.</div>
          </div>
          <Link href="/leaderboard" className="btn btn-sm btn-ghost">
            See full board →
          </Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Employee</th>
              <th>Score</th>
              <th>Recognition</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.slice(0, 10).map((e, i) => {
              const rank = i + 1;
              const isMe = e.employee_id === employee.id;
              return (
                <tr className="row-hover" key={e.employee_id} style={isMe ? { background: "var(--primary-soft)", borderRadius: 12 } : undefined}>
                  <td>
                    <div className="rank-badge" style={{ background: rank <= 3 ? "var(--gold-soft)" : "var(--primary-soft)", color: rank <= 3 ? "var(--gold)" : "var(--primary)" }}>
                      {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
                    </div>
                  </td>
                  <td>
                    <div className="flex center gap10">
                      <div className="avatar" style={{ width: 32, height: 32, background: "var(--primary)", fontSize: 12 }}>
                        {initials(e.full_name)}
                      </div>
                      <div>
                        <div className="bold small">
                          {e.full_name}
                          {isMe ? <span className="tiny muted"> (you)</span> : null}
                        </div>
                        <div className="tiny muted">{e.department ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono bold">{e.overall_score}</td>
                  <td>
                    {e.badge_title ? (
                      <span className="pill pill-primary">
                        {e.badge_icon} {e.badge_title}
                      </span>
                    ) : (
                      <span className="tiny muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={4} className="muted small" style={{ padding: 20, textAlign: "center" }}>
                  No scores recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
