"use client";

import { useActionState } from "react";
import { resetQuizAttempt, type ActionState } from "./actions";

export default function ResetAttemptButton({ employeeId }: { employeeId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => resetQuizAttempt(formData),
    undefined
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="employee_id" value={employeeId} />
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
        {pending ? "…" : "Reset"}
      </button>
      {state?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{state.error}</div>}
    </form>
  );
}
