"use client";

import { useActionState, useState } from "react";
import { requestCorrection } from "@/lib/actions/attendance";

const REQUEST_TYPES = [
  { value: "FORGOT_CLOCK_IN", label: "Forgot to clock in" },
  { value: "FORGOT_CLOCK_OUT", label: "Forgot to clock out" },
  { value: "WRONG_TIME", label: "Wrong attendance time" },
  { value: "OTHER", label: "Other" },
];

// datetime-local inputs give a naive "2026-08-14T09:30" string with no
// timezone. `new Date(...)` parses that as the browser's local time, which
// is what the employee actually meant — converting here (not on the server,
// which has no idea what timezone the employee typed in) is what keeps a
// 9:30am correction request from silently landing as some other hour.
function toIso(localValue: string): string {
  if (!localValue) return "";
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export default function CorrectionForm() {
  const [state, formAction, pending] = useActionState(requestCorrection, undefined);
  const [clockInLocal, setClockInLocal] = useState("");
  const [clockOutLocal, setClockOutLocal] = useState("");

  return (
    <form action={formAction} className="card pad-lg" style={{ display: "grid", gap: 12 }}>
      <div className="bold">Request an attendance correction</div>

      <input type="hidden" name="requested_clock_in_at" value={toIso(clockInLocal)} />
      <input type="hidden" name="requested_clock_out_at" value={toIso(clockOutLocal)} />

      <div className="grid g2" style={{ gap: 12 }}>
        <label className="flex col gap6">
          <span className="tiny muted">Date</span>
          <input type="date" name="work_date" className="field" required />
        </label>
        <label className="flex col gap6">
          <span className="tiny muted">Type</span>
          <select name="request_type" className="field" required defaultValue="">
            <option value="" disabled>
              Select a reason
            </option>
            {REQUEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex col gap6">
          <span className="tiny muted">Requested clock in</span>
          <input
            type="datetime-local"
            className="field"
            value={clockInLocal}
            onChange={(e) => setClockInLocal(e.target.value)}
          />
        </label>
        <label className="flex col gap6">
          <span className="tiny muted">Requested clock out</span>
          <input
            type="datetime-local"
            className="field"
            value={clockOutLocal}
            onChange={(e) => setClockOutLocal(e.target.value)}
          />
        </label>
      </div>

      <label className="flex col gap6">
        <span className="tiny muted">Reason</span>
        <textarea name="reason" className="field" rows={2} required />
      </label>
      <label className="flex col gap6">
        <span className="tiny muted">Additional comment (optional)</span>
        <textarea name="comment" className="field" rows={2} />
      </label>

      <div className="flex gap10 center">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Submitting…" : "Submit request"}
        </button>
        {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
      </div>
    </form>
  );
}
