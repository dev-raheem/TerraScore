"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { grantLocationConsent } from "@/lib/actions/attendance";

export default function ConsentPrompt() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await grantLocationConsent();
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="card pad-lg" style={{ borderColor: "var(--gold)" }}>
      <div className="bold" style={{ marginBottom: 8 }}>📍 Live location tracking</div>
      <p className="small muted" style={{ marginBottom: 12, lineHeight: 1.6 }}>
        While you&apos;re clocked in, TerraScore can share your approximate location with HR so they know whether
        you&apos;re at the office or working elsewhere. Tracking only runs while this browser tab is open and
        you&apos;re clocked in — it stops the moment you clock out or close the tab, and never runs in the
        background. This is separate from your attendance record, which is never changed based on location alone.
      </p>
      <div className="flex gap10 center">
        <button type="button" className="btn btn-primary btn-sm" onClick={handleAccept} disabled={pending}>
          {pending ? "Saving…" : "Allow location tracking"}
        </button>
        {error && <span className="tiny" style={{ color: "var(--coral)" }}>{error}</span>}
      </div>
      <div className="tiny muted" style={{ marginTop: 10 }}>
        You can still clock in and out without enabling this — it only affects live location sharing.
      </div>
    </div>
  );
}
