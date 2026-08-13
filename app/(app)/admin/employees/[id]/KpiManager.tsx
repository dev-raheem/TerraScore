"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addKpi, deleteKpi, updateKpi, type ActionState } from "./actions";

type Kpi = { id: string; name: string; score: number; weight: number };

function KpiRow({ employeeId, kpi }: { employeeId: string; kpi: Kpi }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await updateKpi(formData);
      if (!result?.error) setEditing(false);
      return result;
    },
    undefined
  );

  if (editing) {
    return (
      <tr>
        <td colSpan={4}>
          <form action={formAction} className="flex gap8 wrap" style={{ padding: "6px 0" }}>
            <input type="hidden" name="employee_id" value={employeeId} />
            <input type="hidden" name="kpi_id" value={kpi.id} />
            <input name="name" defaultValue={kpi.name} required className="field" style={{ flex: 2, minWidth: 140 }} />
            <input name="score" type="number" min={0} max={100} defaultValue={kpi.score} required className="field" style={{ width: 90 }} />
            <input name="weight" type="number" min={0} max={100} defaultValue={kpi.weight} required className="field" style={{ width: 100 }} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
            {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="small">{kpi.name}</td>
      <td className="mono">{kpi.score}</td>
      <td className="mono">{kpi.weight}%</td>
      <td>
        <div className="flex gap6">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <form
            action={async (formData) => {
              await deleteKpi(formData);
            }}
          >
            <input type="hidden" name="employee_id" value={employeeId} />
            <input type="hidden" name="kpi_id" value={kpi.id} />
            <button type="submit" className="btn btn-outline btn-sm">✕</button>
          </form>
        </div>
      </td>
    </tr>
  );
}

export default function KpiManager({ employeeId, kpis }: { employeeId: string; kpis: Kpi[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => addKpi(formData),
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  const totalWeight = kpis.reduce((sum, k) => sum + k.weight, 0);

  return (
    <div className="card pad-lg">
      <div className="bold" style={{ marginBottom: 10 }}>KPIs</div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Score</th>
            <th>Weight</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {kpis.map((k) => (
            <KpiRow key={k.id} employeeId={employeeId} kpi={k} />
          ))}
          {kpis.length === 0 && (
            <tr>
              <td colSpan={4} className="muted small" style={{ padding: 14, textAlign: "center" }}>
                No KPIs yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="tiny muted" style={{ margin: "8px 0" }}>
        Total weight: {totalWeight}%{totalWeight !== 100 ? " (should add up to 100%)" : ""}
      </div>

      <form ref={formRef} action={formAction} className="flex gap8 wrap" style={{ marginTop: 10 }}>
        <input type="hidden" name="employee_id" value={employeeId} />
        <input name="name" placeholder="KPI name" required className="field" style={{ flex: 2, minWidth: 140 }} />
        <input name="score" type="number" min={0} max={100} placeholder="Score" required className="field" style={{ width: 90 }} />
        <input name="weight" type="number" min={0} max={100} placeholder="Weight %" required className="field" style={{ width: 100 }} />
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Adding…" : "+ Add"}
        </button>
      </form>
      {state?.error && (
        <div className="small" style={{ color: "var(--coral)", marginTop: 8 }}>
          {state.error}
        </div>
      )}
    </div>
  );
}
