"use client";

import { useActionState, useState } from "react";
import { approveCorrection, rejectCorrection } from "@/lib/actions/attendance";

// Shared by the per-employee detail page and the org-wide corrections queue
// — approving/rejecting a request always needs the same admin_comment +
// approve/reject controls regardless of where HR is looking at it from.
export default function CorrectionDecisionForm({ requestId }: { requestId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(approveCorrection, undefined);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectCorrection, undefined);
  const [comment, setComment] = useState("");

  const pending = approvePending || rejectPending;
  const error = approveState?.error ?? rejectState?.error;

  return (
    <div className="flex col gap8">
      <textarea
        className="field"
        rows={2}
        placeholder="Admin comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex gap8">
        <form action={approveAction}>
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="admin_comment" value={comment} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {approvePending ? "Approving…" : "Approve"}
          </button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="admin_comment" value={comment} />
          <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
            {rejectPending ? "Rejecting…" : "Reject"}
          </button>
        </form>
      </div>
      {error && <div className="tiny" style={{ color: "var(--coral)" }}>{error}</div>}
    </div>
  );
}
