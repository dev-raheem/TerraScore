"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clockIn, clockOut } from "@/lib/actions/attendance";
import { getCurrentPosition } from "@/components/attendance/browserGeolocation";

export default function ClockButton({ mode }: { mode: "in" | "out" }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const position = await getCurrentPosition();
      const action = mode === "in" ? clockIn : clockOut;
      const result = await action({
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
        accuracy: position?.accuracy ?? null,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button type="button" className="btn btn-primary" onClick={handleClick} disabled={pending}>
        {pending ? (mode === "in" ? "Clocking in…" : "Clocking out…") : mode === "in" ? "Clock In" : "Clock Out"}
      </button>
      {error && (
        <div className="tiny" style={{ color: "var(--coral)", marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
