"use client";

import { useActionState } from "react";
import type { Office } from "@/lib/attendance";
import { assignEmployeeOffice } from "@/lib/actions/offices";

export default function OfficeAssignmentForm({
  employeeId,
  currentOfficeId,
  offices,
}: {
  employeeId: string;
  currentOfficeId: string | null;
  offices: Office[];
}) {
  const [state, formAction, pending] = useActionState(assignEmployeeOffice, undefined);

  return (
    <form action={formAction} className="flex gap8 center" style={{ flexWrap: "wrap" }}>
      <input type="hidden" name="employee_id" value={employeeId} />
      <select name="office_id" defaultValue={currentOfficeId ?? ""} className="field" style={{ maxWidth: 240 }}>
        <option value="">No office assigned</option>
        {offices.map((office) => (
          <option key={office.id} value={office.id}>
            {office.name}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
        {pending ? "Saving…" : "Save office"}
      </button>
      {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
    </form>
  );
}
