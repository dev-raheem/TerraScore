"use client";

import { useActionState, useEffect } from "react";
import type { Employee } from "@/lib/session";
import { updateEmployee } from "./actions";

export default function EditEmployeeModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateEmployee, undefined);

  useEffect(() => {
    if (state && !state.error) onClose();
  }, [state, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card pad-lg" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex between center" style={{ marginBottom: 14 }}>
          <div className="bold">Edit employee</div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <form action={formAction} className="grid g2">
          <input type="hidden" name="id" value={employee.id} />
          <input name="full_name" placeholder="Full name" defaultValue={employee.full_name} required className="field" />
          <input name="email" type="email" placeholder="Email" defaultValue={employee.email} required className="field" />
          <input name="employee_code" placeholder="Employee code" defaultValue={employee.employee_code ?? ""} className="field" />
          <input name="department" placeholder="Department" defaultValue={employee.department ?? ""} className="field" />
          <input name="designation" placeholder="Designation" defaultValue={employee.designation ?? ""} className="field" />
          <input name="reporting_manager" placeholder="Reporting manager" defaultValue={employee.reporting_manager ?? ""} className="field" />
          <input name="phone" placeholder="Phone" defaultValue={employee.phone ?? ""} className="field" />
          <input name="joining_date" type="date" defaultValue={employee.joining_date ?? ""} className="field" />
          <select name="role" defaultValue={employee.role} className="field">
            <option value="employee">Employee</option>
            <option value="hr">HR</option>
          </select>

          <div style={{ gridColumn: "1 / -1" }} className="flex gap8">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>

        {state?.error && (
          <div className="small" style={{ color: "var(--coral)", marginTop: 12 }}>
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}
