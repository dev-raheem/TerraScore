import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export default async function BadgesPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();
  const [{ data: badges }, { data: earned }] = await Promise.all([
    supabase.from("ts_badges").select("*").order("name"),
    supabase.from("ts_employee_badges").select("badge_id").eq("employee_id", employee.id),
  ]);

  const earnedIds = new Set((earned ?? []).map((b) => b.badge_id as string));
  const badgeList = badges ?? [];
  const earnedCount = badgeList.filter((b) => earnedIds.has(b.id)).length;

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Badges & Achievements</div>
          <div className="page-sub">
            {badgeList.length} badge types across the company · you&apos;ve earned {earnedCount}
          </div>
        </div>
      </div>
      <div className="grid g4 enter enter-d1">
        {badgeList.map((b) => {
          const isEarned = earnedIds.has(b.id);
          return (
            <div
              key={b.id}
              className="card pad flex col gap8"
              style={{ textAlign: "center", alignItems: "center", opacity: isEarned ? 1 : 0.55, position: "relative" }}
            >
              {isEarned ? (
                <span className="pill pill-emerald tiny" style={{ position: "absolute", top: 12, right: 12 }}>
                  Earned
                </span>
              ) : null}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  background: "var(--gold-soft)",
                }}
              >
                {b.icon}
              </div>
              <div className="bold small">{b.name}</div>
              <div className="tiny muted">{b.description}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
