import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Ring from "@/components/Ring";
import StatCard from "@/components/dashboard/StatCard";
import SpotlightBanner from "@/components/dashboard/SpotlightBanner";
import { getCurrentEmployee } from "@/lib/session";
import { getLeaderboard, getEomTeaser } from "@/lib/leaderboard";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/data";

export const metadata: Metadata = { title: "Dashboard" };

const SCORE_TIERS = [
  { min: 90, label: "Excellent" },
  { min: 75, label: "Good" },
  { min: 60, label: "Fair" },
  { min: 0, label: "Needs focus" },
];

function scoreTier(score: number) {
  return SCORE_TIERS.find((t) => score >= t.min)!.label;
}

export default async function DashboardPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const isHr = employee.role === "hr";
  const supabase = await createClient();
  const [leaderboard, eomTeaser, { count: totalEmployees }, { count: pendingCount }, { data: latestMonthly }] =
    await Promise.all([
      getLeaderboard(),
      isHr ? Promise.resolve(null) : getEomTeaser(),
      supabase.from("ts_employees").select("id", { count: "exact", head: true }),
      supabase.from("ts_employees").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("ts_monthly_scores")
        .select("score")
        .eq("employee_id", employee.id)
        .order("month", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const totalRanked = leaderboard.length;
  const myRank = leaderboard.findIndex((e) => e.employee_id === employee.id) + 1;
  const percentile = myRank > 0 && totalRanked > 0 ? Math.max(1, Math.round((myRank / totalRanked) * 100)) : null;
  const sameDept = leaderboard.filter((e) => e.department === employee.department);
  const deptRank = sameDept.findIndex((e) => e.employee_id === employee.id) + 1;
  const myEntry = leaderboard.find((e) => e.employee_id === employee.id);
  const topScorer = leaderboard[0];
  const firstName = employee.full_name.split(" ")[0];

  const scoreDelta = latestMonthly ? employee.overall_score - latestMonthly.score : null;
  const avgScore = leaderboard.length
    ? Math.round(leaderboard.reduce((sum, e) => sum + e.overall_score, 0) / leaderboard.length)
    : null;

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

      <div className="grid g4 enter enter-d1" style={{ marginBottom: 18 }}>
        {isHr ? (
          <>
            <StatCard
              label="Total employees"
              value={totalEmployees ?? 0}
              sub={pendingCount ? `${pendingCount} pending approval${pendingCount === 1 ? "" : "s"}` : "All accounts approved"}
            />
            <StatCard
              label="Average score"
              value={avgScore ?? "—"}
              sub={`Across ${leaderboard.length} scored employee${leaderboard.length === 1 ? "" : "s"}`}
            />
            <StatCard label="Top score" value={topScorer?.overall_score ?? "—"} sub={topScorer?.full_name ?? "No scores yet"} />
            <StatCard
              label="Pending approvals"
              value={pendingCount ?? 0}
              sub={pendingCount ? "Needs your review" : "All caught up"}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Overall score"
              value={`${employee.overall_score} / 100`}
              sub={scoreTier(employee.overall_score)}
              trend={
                scoreDelta !== null
                  ? {
                      direction: scoreDelta > 0 ? "up" : scoreDelta < 0 ? "down" : "flat",
                      label: `${scoreDelta > 0 ? "+" : ""}${scoreDelta} pts vs last month`,
                    }
                  : undefined
              }
            />
            <StatCard
              label="Company rank"
              value={myRank > 0 ? `#${myRank}` : "—"}
              sub={totalRanked > 0 ? `of ${totalRanked} employees${percentile ? ` · Top ${percentile}%` : ""}` : "Not ranked yet"}
            />
            <StatCard
              label="Department rank"
              value={deptRank > 0 ? `#${deptRank}` : "—"}
              sub={sameDept.length > 0 ? `of ${sameDept.length} in ${employee.department ?? "your dept"}` : "No department peers yet"}
            />
            <StatCard
              label="Recognition"
              value={myEntry?.badge_title ?? "No badge yet"}
              sub={myEntry?.badge_title ? `${myEntry.badge_icon ?? "🏅"} Current featured badge` : "Keep growing to earn one"}
            />
          </>
        )}
      </div>

      <div className="grid g12-8-4 enter enter-d2" style={{ marginBottom: 18, alignItems: "stretch" }}>
        {isHr && topScorer ? (
          <SpotlightBanner label="Current top scorer" person={topScorer} score={topScorer.overall_score} />
        ) : !isHr && eomTeaser ? (
          <SpotlightBanner label="Employee of the Month" person={eomTeaser} />
        ) : (
          <div className="card pad-lg flex col center" style={{ justifyContent: "center", textAlign: "center" }}>
            <div className="muted small">No scores recorded yet.</div>
          </div>
        )}
        <div className="card pad-lg flex col" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div className="tiny muted bold" style={{ marginBottom: 10 }}>YOUR OVERALL SCORE</div>
          <Ring percent={employee.overall_score} size={150} strokeWidth={13} center={employee.overall_score} sub="/ 100" />
        </div>
      </div>

      {isHr && (
        <div className="card pad-lg enter enter-d3">
          <div className="flex between center" style={{ marginBottom: 14 }}>
            <div>
              <div className="bold" style={{ fontSize: 16 }}>Company Leaderboard</div>
              <div className="tiny muted">HR-only view — visible only to you.</div>
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
      )}
    </>
  );
}
