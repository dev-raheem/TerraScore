"use client";

import { useActionState, useEffect } from "react";
import type { Office } from "@/lib/attendance";
import { updateOffice } from "@/lib/actions/offices";

export default function EditOfficeModal({ office, onClose }: { office: Office; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(updateOffice, undefined);

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
      <div className="card pad-lg" style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex between center" style={{ marginBottom: 14 }}>
          <div className="bold">Edit office</div>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <form action={formAction} className="grid g2">
          <input type="hidden" name="id" value={office.id} />
          <input name="name" placeholder="Office name" defaultValue={office.name} required className="field" />
          <input name="address" placeholder="Address" defaultValue={office.address ?? ""} className="field" />
          <input name="latitude" type="number" step="any" defaultValue={office.latitude} required className="field" />
          <input name="longitude" type="number" step="any" defaultValue={office.longitude} required className="field" />
          <input
            name="radius_meters"
            type="number"
            step="1"
            min="1"
            defaultValue={office.radius_meters}
            required
            className="field"
          />
          <input name="timezone" defaultValue={office.timezone} required className="field" />
          <select name="status" defaultValue={office.status} className="field">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
