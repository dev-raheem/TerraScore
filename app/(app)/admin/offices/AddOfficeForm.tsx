"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createOffice } from "@/lib/actions/offices";
import { getCurrentPosition } from "@/components/attendance/browserGeolocation";

export default function AddOfficeForm() {
  const [state, formAction, pending] = useActionState(createOffice, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  async function handleUseCurrentLocation() {
    setLocating(true);
    setLocateError(null);
    const position = await getCurrentPosition();
    setLocating(false);
    if (!position) {
      setLocateError("Couldn't get your location — allow location access in the browser and try again.");
      return;
    }
    if (latRef.current) latRef.current.value = String(position.latitude);
    if (lngRef.current) lngRef.current.value = String(position.longitude);
  }

  return (
    <div className="card pad-lg enter" style={{ marginBottom: 22 }}>
      <div className="bold" style={{ marginBottom: 14 }}>Add office</div>
      <form ref={formRef} action={formAction} className="grid g2">
        <input name="name" placeholder="Office name (e.g. Varanasi HQ)" required className="field" />
        <input name="address" placeholder="Address" className="field" />
        <input ref={latRef} name="latitude" type="number" step="any" placeholder="Latitude" required className="field" />
        <input ref={lngRef} name="longitude" type="number" step="any" placeholder="Longitude" required className="field" />
        <input name="radius_meters" type="number" step="1" min="1" placeholder="Geofence radius (meters)" defaultValue={150} required className="field" />
        <input name="timezone" placeholder="Timezone (e.g. Asia/Kolkata)" defaultValue="Asia/Kolkata" required className="field" />
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-outline" onClick={handleUseCurrentLocation} disabled={locating}>
            {locating ? "Locating…" : "📍 Use my current location"}
          </button>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Adding…" : "+ Add office"}
          </button>
        </div>
      </form>

      {locateError && (
        <div className="small" style={{ color: "var(--coral)", marginTop: 12 }}>
          {locateError}
        </div>
      )}
      {state?.error && (
        <div className="small" style={{ color: "var(--coral)", marginTop: 12 }}>
          {state.error}
        </div>
      )}
    </div>
  );
}
