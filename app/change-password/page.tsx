"use client";

import { useActionState } from "react";
import { changePassword } from "./actions";

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState(changePassword, undefined);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card pad-lg enter" style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Set a new password</h1>
        <p className="muted small" style={{ marginBottom: 24 }}>
          For security, choose a new password before continuing.
        </p>

        <form action={formAction}>
          <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
            NEW PASSWORD
          </label>
          <div className="input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type="password"
              name="password"
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
            CONFIRM PASSWORD
          </label>
          <div className="input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type="password"
              name="confirm"
              placeholder="Re-enter password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {state?.error && (
            <div className="small" style={{ color: "var(--coral)", margin: "6px 0 16px" }}>
              {state.error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={pending}
            style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: 13, marginTop: 10 }}
          >
            {pending ? "Saving…" : "Save & continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
