"use client";

import { useActionState } from "react";
import { markAllRead, type ActionState } from "./actions";

export default function MarkAllReadButton() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    () => markAllRead(),
    undefined
  );

  return (
    <form action={formAction}>
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
        {pending ? "…" : "Mark all as read"}
      </button>
      {state?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{state.error}</div>}
    </form>
  );
}
