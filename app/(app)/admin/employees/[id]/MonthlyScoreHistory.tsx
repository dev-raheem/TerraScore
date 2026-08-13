"use client";

import { useActionState } from "react";
import { deleteMonthlySnapshot, type ActionState } from "./actions";

type Snapshot = { id: string; month: string; score: number; badge_label: string | null };

function SnapshotRow({ employeeId, snapshot }: { employeeId: string; snapshot: Snapshot }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => deleteMonthlySnapshot(formData),
    undefined
  );

  return (
    <tr>
      <td className="small">
        {new Date(snapshot.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </td>
      <td className="mono">{snapshot.score}</td>
      <td className="small">{snapshot.badge_label ?? "—"}</td>
      <td>
        <form action={formAction}>
          <input type="hidden" name="employee_id" value={employeeId} />
          <input type="hidden" name="snapshot_id" value={snapshot.id} />
          <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>✕</button>
        </form>
        {state?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{state.error}</div>}
      </td>
    </tr>
  );
}

export default function MonthlyScoreHistory({ employeeId, history }: { employeeId: string; history: Snapshot[] }) {
  return (
    <div className="card pad-lg">
      <div className="bold" style={{ marginBottom: 10 }}>Monthly score history</div>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Score</th>
            <th>Badge</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {history.map((s) => (
            <SnapshotRow key={s.id} employeeId={employeeId} snapshot={s} />
          ))}
          {history.length === 0 && (
            <tr>
              <td colSpan={4} className="muted small" style={{ padding: 14, textAlign: "center" }}>
                No monthly snapshots recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
