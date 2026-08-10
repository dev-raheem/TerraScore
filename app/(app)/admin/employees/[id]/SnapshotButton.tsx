"use client";

import { useActionState } from "react";
import { recordMonthlySnapshot, type ActionState } from "./actions";

export default function SnapshotButton({ employeeId }: { employeeId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => recordMonthlySnapshot(formData),
    undefined
  );

  return (
    <form action={formAction} className="flex col" style={{ alignItems: "flex-end" }}>
      <input type="hidden" name="employee_id" value={employeeId} />
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
        {pending ? "Saving…" : "📌 Record this month's score"}
      </button>
      {state?.error && (
        <div className="tiny" style={{ color: "var(--coral)", marginTop: 6 }}>
          {state.error}
        </div>
      )}
    </form>
  );
}
