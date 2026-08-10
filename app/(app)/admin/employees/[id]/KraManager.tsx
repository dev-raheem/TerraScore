"use client";

import { useActionState, useEffect, useRef } from "react";
import { addKra, deleteKra, type ActionState } from "./actions";

type Kra = { id: string; name: string; target: string; achieved: string; pct: number };

export default function KraManager({ employeeId, kras }: { employeeId: string; kras: Kra[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => addKra(formData),
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <div className="card pad-lg">
      <div className="bold" style={{ marginBottom: 10 }}>KRAs</div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Target</th>
            <th>Achieved</th>
            <th>%</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {kras.map((k) => (
            <tr key={k.id}>
              <td className="small">{k.name}</td>
              <td className="mono small">{k.target}</td>
              <td className="mono small">{k.achieved}</td>
              <td className="mono">{k.pct}%</td>
              <td>
                <form
                  action={async (formData) => {
                    await deleteKra(formData);
                  }}
                >
                  <input type="hidden" name="employee_id" value={employeeId} />
                  <input type="hidden" name="kra_id" value={k.id} />
                  <button type="submit" className="btn btn-outline btn-sm">✕</button>
                </form>
              </td>
            </tr>
          ))}
          {kras.length === 0 && (
            <tr>
              <td colSpan={5} className="muted small" style={{ padding: 14, textAlign: "center" }}>
                No KRAs yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form ref={formRef} action={formAction} className="flex gap8 wrap" style={{ marginTop: 10 }}>
        <input type="hidden" name="employee_id" value={employeeId} />
        <input name="name" placeholder="KRA name" required className="field" style={{ flex: 2, minWidth: 140 }} />
        <input name="target" placeholder="Target (e.g. 95%)" required className="field" style={{ width: 130 }} />
        <input name="achieved" placeholder="Achieved (e.g. 93%)" required className="field" style={{ width: 130 }} />
        <input name="pct" type="number" min={0} max={100} placeholder="Completion %" required className="field" style={{ width: 110 }} />
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
