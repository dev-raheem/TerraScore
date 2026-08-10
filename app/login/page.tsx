"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeModeButton from "@/components/ThemeModeButton";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div id="login-screen">
      <div className="login-left">
        <div className="login-box enter">
          <div className="flex center gap10" style={{ marginBottom: 38 }}>
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
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Welcome back</h1>
          <p className="muted" style={{ marginBottom: 30, fontSize: 14.5 }}>
            Sign in to see your score and rank.
          </p>

          <form action={formAction}>
            <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
              EMAIL
            </label>
            <div className="input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <input type="email" name="email" placeholder="you@terrarexenergy.com" required autoComplete="email" />
            </div>
            <label className="tiny bold muted" style={{ display: "block", marginBottom: 6 }}>
              PASSWORD
            </label>
            <div className="input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input type="password" name="password" placeholder="••••••••" required autoComplete="current-password" />
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
              style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: 13, marginTop: 22 }}
            >
              {pending ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className="small muted" style={{ marginTop: 18, textAlign: "center" }}>
            New employee? <Link href="/signup">Create an account</Link>
          </p>

          <div className="flex center gap10" style={{ marginTop: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span className="tiny faint">or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <ThemeModeButton />
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
