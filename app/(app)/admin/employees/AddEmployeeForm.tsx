"use client";

import { useActionState, useEffect, useRef } from "react";
import { addEmployee } from "./actions";

export default function AddEmployeeForm() {
  const [state, formAction, pending] = useActionState(addEmployee, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.tempPassword) formRef.current?.reset();
  }, [state]);

  return (
    <div className="card pad-lg enter" style={{ marginBottom: 22 }}>
      <div className="bold" style={{ marginBottom: 14 }}>Add employee</div>
      <form ref={formRef} action={formAction} className="grid g2">
        <input name="full_name" placeholder="Full name" required className="field" />
        <input name="email" type="email" placeholder="Email" required className="field" />
        <input name="employee_code" placeholder="Employee code (e.g. EMP-2050)" className="field" />
        <input name="department" placeholder="Department" className="field" />
        <input name="designation" placeholder="Designation" className="field" />
        <input name="reporting_manager" placeholder="Reporting manager" className="field" />
        <input name="phone" placeholder="Phone" className="field" />
        <input name="joining_date" type="date" className="field" />
        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Adding…" : "+ Add employee"}
          </button>
        </div>
      </form>

      {state?.error && (
        <div className="small" style={{ color: "var(--coral)", marginTop: 12 }}>
          {state.error}
        </div>
      )}
      {state?.tempPassword && (
        <div className="card-flat pad" style={{ marginTop: 14, background: "var(--emerald-soft)" }}>
          <div className="small bold" style={{ marginBottom: 4 }}>Account created</div>
          <div className="small muted">Share these with the employee — the password is shown only once:</div>
          <div className="mono small bold" style={{ marginTop: 6 }}>
            {state.email} / {state.tempPassword}
          </div>
        </div>
      )}
    </div>
  );
}
