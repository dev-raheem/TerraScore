"use client";

import { useActionState, useRef, useState } from "react";
import { sendNotification, type ActionState } from "./actions";

export type EmployeeOption = { id: string; full_name: string };

export default function SendNotificationForm({ employees }: { employees: EmployeeOption[] }) {
  const [audience, setAudience] = useState<"all" | "employee">("all");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await sendNotification(formData);
      if (!result?.error) {
        formRef.current?.reset();
        setAudience("all");
      }
      return result;
    },
    undefined
  );

  return (
    <div className="card pad-lg enter" style={{ marginBottom: 18 }}>
      <div className="bold" style={{ marginBottom: 12 }}>Send notification (Admin)</div>
      <form ref={formRef} action={formAction} className="flex col gap8">
        <div className="flex gap8 wrap center">
          <label className="tiny flex gap6 center">
            <input type="radio" name="audience" value="all" checked={audience === "all"} onChange={() => setAudience("all")} /> Everyone
          </label>
          <label className="tiny flex gap6 center">
            <input type="radio" name="audience" value="employee" checked={audience === "employee"} onChange={() => setAudience("employee")} /> Specific employee
          </label>
        </div>
        {audience === "employee" && (
          <select name="employee_id" required className="field">
            <option value="">Choose employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>
        )}
        <input name="title" placeholder="Title" required className="field" />
        <input name="message" placeholder="Message (optional)" className="field" />
        <div className="flex between center">
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? "Sending…" : "Send"}
          </button>
          {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
        </div>
      </form>
    </div>
  );
}
