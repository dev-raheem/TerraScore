"use client";

import { useActionState } from "react";
import { approveEmployee, rejectEmployee, type SimpleActionState } from "./actions";

export default function PendingApprovalRow({
  id,
  fullName,
  email,
  meta,
}: {
  id: string;
  fullName: string;
  email: string;
  meta: string;
}) {
  const [approveState, approveAction, approvePending] = useActionState<SimpleActionState, FormData>(
    (_prev, formData) => approveEmployee(formData),
    undefined
  );
  const [rejectState, rejectAction, rejectPending] = useActionState<SimpleActionState, FormData>(
    (_prev, formData) => rejectEmployee(formData),
    undefined
  );

  return (
    <div
      className="flex between center"
      style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}
    >
      <div>
        <div className="bold small">{fullName}</div>
        <div className="tiny muted">
          {email} · {meta}
        </div>
        {(approveState?.error || rejectState?.error) && (
          <div className="tiny" style={{ color: "var(--coral)" }}>
            {approveState?.error ?? rejectState?.error}
          </div>
        )}
      </div>
      <div className="flex gap8">
        <form action={approveAction}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={approvePending}>
            {approvePending ? "Approving…" : "Approve"}
          </button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="btn btn-outline btn-sm" disabled={rejectPending}>
            {rejectPending ? "Rejecting…" : "Reject"}
          </button>
        </form>
      </div>
    </div>
  );
}
