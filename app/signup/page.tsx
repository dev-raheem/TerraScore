"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signUp } from "./actions";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, undefined);

  return (
    <div id="login-screen">
      <div className="login-left">
        <div className="login-box enter">
          <div className="flex center gap10" style={{ marginBottom: 30 }}>
            <div
              className="mark"
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 6px 16px -4px rgba(4,60,64,.5)",
              }}
            >
              <Image src="/brand/terrarex-mark-tile.png" alt="TerraRex" fill className="object-cover" />
            </div>
            <span style={{ fontFamily: "var(--font-geist)", fontWeight: 800, fontSize: 19 }}>TerraScore</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Create your account</h1>
          <p className="muted" style={{ marginBottom: 24, fontSize: 14.5 }}>
            HR needs to approve your account before you can sign in.
          </p>

          <form action={formAction}>
            <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
              FULL NAME
            </label>
            <div className="input-wrap">
              <input name="full_name" placeholder="Your name" required autoComplete="name" />
            </div>

            <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
              EMAIL
            </label>
            <div className="input-wrap">
              <input type="email" name="email" placeholder="you@terrarexenergy.com" required autoComplete="email" />
            </div>

            <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
              DEPARTMENT
            </label>
            <div className="input-wrap">
              <input name="department" placeholder="e.g. Sales" autoComplete="off" />
            </div>

            <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
              DESIGNATION
            </label>
            <div className="input-wrap">
              <input name="designation" placeholder="e.g. Sales executive" autoComplete="off" />
            </div>

            <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
              PHONE
            </label>
            <div className="input-wrap">
              <input name="phone" placeholder="Optional" autoComplete="tel" />
            </div>

            <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
              PASSWORD
            </label>
            <div className="input-wrap">
              <input type="password" name="password" placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" />
            </div>

            <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
              CONFIRM PASSWORD
            </label>
            <div className="input-wrap">
              <input type="password" name="confirm" placeholder="Re-enter password" required minLength={8} autoComplete="new-password" />
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
              style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: 13, marginTop: 12 }}
            >
              {pending ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <p className="small muted" style={{ marginTop: 20, textAlign: "center" }}>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="login-right">
        <div className="blob" style={{ width: 340, height: 340, background: "#fff", top: -80, left: -80 }} />
        <div className="blob" style={{ width: 260, height: 260, background: "#021F21", bottom: -60, right: -40 }} />
        <div className="orbit-card">
          <div className="glass pad-lg enter" style={{ background: "rgba(255,255,255,.16)", borderColor: "rgba(255,255,255,.35)", color: "#fff" }}>
            <div className="flex between center" style={{ marginBottom: 16 }}>
              <span className="pill" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>
                🏆 Employee of the Month
              </span>
            </div>
            <div className="flex center gap12">
              <div className="avatar" style={{ width: 56, height: 56, background: "rgba(255,255,255,.25)", fontSize: 20 }}>
                PS
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Priyanka Sharma</div>
                <div style={{ opacity: 0.85, fontSize: 13 }}>Registration · Score 96</div>
              </div>
            </div>
            <div className="divider" style={{ background: "rgba(255,255,255,.25)" }} />
            <div className="flex between small">
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, fontFamily: "var(--font-jetbrains-mono)" }}>#1</div>
                <div style={{ opacity: 0.75 }}>Company rank</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, fontFamily: "var(--font-jetbrains-mono)" }}>96</div>
                <div style={{ opacity: 0.75 }}>Overall score</div>
              </div>
            </div>
          </div>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,.85)", fontSize: 13, marginTop: 18 }}>
            &ldquo;Zero errors, seven months straight.&rdquo; — TerraScore
          </p>
        </div>
      </div>
    </div>
  );
}
