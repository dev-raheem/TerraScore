"use client";

import { toggleBadge } from "./actions";

type Badge = { id: string; name: string; icon: string; description: string };

export default function BadgeManager({
  employeeId,
  badges,
  earnedBadgeIds,
}: {
  employeeId: string;
  badges: Badge[];
  earnedBadgeIds: string[];
}) {
  const earned = new Set(earnedBadgeIds);

  return (
    <div className="card pad-lg enter enter-d2">
      <div className="bold" style={{ marginBottom: 12 }}>Badges</div>
      <div className="grid g4">
        {badges.map((b) => {
          const isEarned = earned.has(b.id);
          return (
            <form
              key={b.id}
              action={async (formData) => {
                await toggleBadge(formData);
              }}
            >
              <input type="hidden" name="employee_id" value={employeeId} />
              <input type="hidden" name="badge_id" value={b.id} />
              <input type="hidden" name="award" value={isEarned ? "0" : "1"} />
              <button
                type="submit"
                className="card-flat pad flex col gap6"
                style={{
                  textAlign: "center",
                  alignItems: "center",
                  width: "100%",
                  border: isEarned ? "1px solid var(--emerald)" : undefined,
                  background: isEarned ? "var(--emerald-soft)" : undefined,
                }}
              >
                <div style={{ fontSize: 22 }}>{b.icon}</div>
                <div className="bold small">{b.name}</div>
                <div className="tiny muted">{isEarned ? "Awarded — click to revoke" : "Click to award"}</div>
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
