"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addKra, deleteKra, updateKra, type ActionState } from "./actions";

type Kra = { id: string; name: string; target: string; achieved: string; pct: number };

function KraRow({ employeeId, kra }: { employeeId: string; kra: Kra }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await updateKra(formData);
      if (!result?.error) setEditing(false);
      return result;
    },
    undefined
  );

  if (editing) {
    return (
      <tr>
        <td colSpan={5}>
          <form action={formAction} className="flex gap8 wrap" style={{ padding: "6px 0" }}>
            <input type="hidden" name="employee_id" value={employeeId} />
            <input type="hidden" name="kra_id" value={kra.id} />
            <input name="name" defaultValue={kra.name} required className="field" style={{ flex: 2, minWidth: 140 }} />
            <input name="target" defaultValue={kra.target} required className="field" style={{ width: 130 }} />
            <input name="achieved" defaultValue={kra.achieved} required className="field" style={{ width: 130 }} />
            <input name="pct" type="number" min={0} max={100} defaultValue={kra.pct} required className="field" style={{ width: 110 }} />
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
      <td className="small">{kra.name}</td>
      <td className="mono small">{kra.target}</td>
      <td className="mono small">{kra.achieved}</td>
      <td className="mono">{kra.pct}%</td>
      <td>
        <div className="flex gap6">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <form
            action={async (formData) => {
              await deleteKra(formData);
            }}
          >
            <input type="hidden" name="employee_id" value={employeeId} />
            <input type="hidden" name="kra_id" value={kra.id} />
            <button type="submit" className="btn btn-outline btn-sm">✕</button>
          </form>
        </div>
      </td>
    </tr>
  );
}

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
            <KraRow key={k.id} employeeId={employeeId} kra={k} />
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
