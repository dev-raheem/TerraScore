import type { Metadata } from "next";
import BarMini from "@/components/BarMini";
import { requireHr } from "@/lib/session";
import { getLeaderboard } from "@/lib/leaderboard";
import { initials } from "@/lib/data";

export const metadata: Metadata = { title: "Leaderboard" };

// HR-only: this is the one place every employee's actual score is listed
// side by side, so it's gated the same way as /admin.
export default async function LeaderboardPage() {
  const employee = await requireHr();

  const leaderboard = await getLeaderboard();
  const top3 = leaderboard.slice(0, 3);

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Company Leaderboard</div>
          <div className="page-sub">All {leaderboard.length} employees, ranked live by overall score</div>
        </div>
      </div>

      <div className="grid g3 enter enter-d1" style={{ marginBottom: 18 }}>
        {top3.map((e, i) => (
          <div
            key={e.employee_id}
            className="card pad-lg flex col center gap8"
            style={{
              textAlign: "center",
              ...(i === 0 ? { transform: "translateY(-10px)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--gold)" } : {}),
            }}
          >
            <div style={{ fontSize: 34 }}>{["🥇", "🥈", "🥉"][i]}</div>
            <div className="avatar" style={{ width: 58, height: 58, fontSize: 19, background: "var(--primary)" }}>
              {initials(e.full_name)}
            </div>
            <div className="bold">{e.full_name}</div>
            <div className="tiny muted">{e.department ?? "—"}</div>
            <div className="mono bold" style={{ fontSize: 24 }}>{e.overall_score}</div>
            {e.badge_title && (
              <span className="pill pill-primary">
                {e.badge_icon} {e.badge_title}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="card pad-lg enter enter-d2">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Employee</th>
              <th>Score</th>
              <th style={{ width: 140 }}>Progress</th>
              <th>Recognition</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((e, i) => {
              const rank = i + 1;
              const isMe = e.employee_id === employee.id;
              return (
                <tr className="row-hover" key={e.employee_id}>
                  <td>
                    <div className="rank-badge" style={{ background: rank <= 3 ? "var(--gold-soft)" : "var(--primary-soft)", color: rank <= 3 ? "var(--gold)" : "var(--primary)" }}>
                      {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
                    </div>
                  </td>
                  <td>
                    <div className="flex center gap10">
                      <div className="avatar" style={{ width: 34, height: 34, background: "var(--primary)", fontSize: 12.5 }}>
                        {initials(e.full_name)}
                      </div>
                      <div>
                        <div className="bold small">
                          {e.full_name}
                          {isMe ? <span className="pill pill-primary tiny" style={{ marginLeft: 6 }}>You</span> : null}
                        </div>
                        <div className="tiny muted">{e.department ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono bold" style={{ fontSize: 15 }}>{e.overall_score}</td>
                  <td>
                    <BarMini pct={e.overall_score} />
                  </td>
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
                <td colSpan={5} className="muted small" style={{ padding: 20, textAlign: "center" }}>
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
