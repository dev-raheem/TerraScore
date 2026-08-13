"use client";

import { useActionState } from "react";
import { completeTask, type ActionState } from "./actions";

export default function TaskActions({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => completeTask(formData),
    undefined
  );

  return (
    <form action={formAction} className="flex col gap6" style={{ alignItems: "flex-end" }}>
      <input type="hidden" name="task_id" value={taskId} />
      <div className="flex gap6 center">
        <input name="note" placeholder="Note (optional)" className="field" style={{ width: 180 }} />
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : "Mark complete"}
        </button>
      </div>
      {state?.error && (
        <div className="tiny" style={{ color: "var(--coral)" }}>
          {state.error}
        </div>
      )}
    </form>
  );
}
