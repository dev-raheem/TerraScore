"use client";

import { useActionState, useEffect, useRef } from "react";
import { createOffice } from "@/lib/actions/offices";

export default function AddOfficeForm() {
  const [state, formAction, pending] = useActionState(createOffice, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <div className="card pad-lg enter" style={{ marginBottom: 22 }}>
      <div className="bold" style={{ marginBottom: 14 }}>Add office</div>
      <form ref={formRef} action={formAction} className="grid g2">
        <input name="name" placeholder="Office name (e.g. Varanasi HQ)" required className="field" />
        <input name="address" placeholder="Address" className="field" />
        <input name="latitude" type="number" step="any" placeholder="Latitude" required className="field" />
        <input name="longitude" type="number" step="any" placeholder="Longitude" required className="field" />
        <input name="radius_meters" type="number" step="1" min="1" placeholder="Geofence radius (meters)" defaultValue={150} required className="field" />
        <input name="timezone" placeholder="Timezone (e.g. Asia/Kolkata)" defaultValue="Asia/Kolkata" required className="field" />
        <div style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Adding…" : "+ Add office"}
          </button>
        </div>
      </form>

      {state?.error && (
        <div className="small" style={{ color: "var(--coral)", marginTop: 12 }}>
          {state.error}
        </div>
      )}
    </div>
  );
}
