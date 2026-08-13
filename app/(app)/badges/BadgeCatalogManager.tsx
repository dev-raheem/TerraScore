"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addBadge, deleteBadge, updateBadge, type ActionState } from "./actions";

export type BadgeDef = { id: string; name: string; icon: string; description: string };

function EditBadgeForm({ badge, onDone }: { badge: BadgeDef; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => updateBadge(formData),
    undefined
  );

  useEffect(() => {
    if (state && !state.error) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex gap8 wrap center" style={{ padding: "8px 0" }}>
      <input type="hidden" name="badge_id" value={badge.id} />
      <input name="icon" defaultValue={badge.icon} required className="field" style={{ width: 60, textAlign: "center" }} />
      <input name="name" defaultValue={badge.name} required className="field" style={{ flex: 1, minWidth: 140 }} />
      <input name="description" defaultValue={badge.description} required className="field" style={{ flex: 2, minWidth: 180 }} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      <button type="button" className="btn btn-outline btn-sm" onClick={onDone}>
        Cancel
      </button>
      {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
    </form>
  );
}

function BadgeRow({ badge }: { badge: BadgeDef }) {
  const [editing, setEditing] = useState(false);
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(
    (_prev, formData) => deleteBadge(formData),
    undefined
  );

  if (editing) return <EditBadgeForm badge={badge} onDone={() => setEditing(false)} />;

  return (
    <div className="flex between center gap12" style={{ padding: "9px 0", borderTop: "1px solid var(--border)" }}>
      <div className="flex gap10 center">
        <span style={{ fontSize: 20 }}>{badge.icon}</span>
        <div>
          <div className="small bold">{badge.name}</div>
          <div className="tiny muted">{badge.description}</div>
        </div>
      </div>
      <div className="flex gap6">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
          Edit
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="badge_id" value={badge.id} />
          <button type="submit" className="btn btn-outline btn-sm">✕</button>
        </form>
      </div>
      {deleteState?.error && <div className="tiny" style={{ color: "var(--coral)" }}>{deleteState.error}</div>}
    </div>
  );
}

function AddBadgeForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    (_prev, formData) => addBadge(formData),
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex gap8 wrap" style={{ marginTop: 12 }}>
      <input name="icon" placeholder="🏅" required className="field" style={{ width: 60, textAlign: "center" }} />
      <input name="name" placeholder="Badge name" required className="field" style={{ flex: 1, minWidth: 140 }} />
      <input name="description" placeholder="Description" required className="field" style={{ flex: 2, minWidth: 180 }} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? "Adding…" : "+ Add badge"}
      </button>
      {state?.error && <span className="tiny" style={{ color: "var(--coral)" }}>{state.error}</span>}
    </form>
  );
}

export default function BadgeCatalogManager({ badges }: { badges: BadgeDef[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card pad-lg enter" style={{ marginTop: 18 }}>
      <div className="flex between center">
        <div className="bold">Manage badge catalog (Admin)</div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Manage"}
        </button>
      </div>
      {open && (
        <>
          <div style={{ marginTop: 8 }}>
            {badges.map((b) => (
              <BadgeRow key={b.id} badge={b} />
            ))}
            {badges.length === 0 && <div className="muted small">No badge types yet.</div>}
          </div>
          <AddBadgeForm />
          <div className="tiny muted" style={{ marginTop: 8 }}>
            Deleting a badge type also removes it from anyone who was awarded it.
          </div>
        </>
      )}
    </div>
  );
}
