"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icons";

export default function RouteError({
  error,
  retry,
  title = "This section couldn't load",
  message = "Something went wrong on our end. Try again — if it keeps happening, let HR know.",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  message?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="card pad-lg flex col center gap12"
      style={{ textAlign: "center", padding: "48px 28px" }}
    >
      <div className="icon-box" style={{ background: "var(--coral-soft)", color: "var(--coral)" }}>
        <Icon name="alert" style={{ width: 20, height: 20 }} />
      </div>
      <div className="bold" style={{ fontSize: 17 }}>
        {title}
      </div>
      <p className="muted small" style={{ maxWidth: 380 }}>
        {message}
      </p>
      {error.digest && <p className="tiny faint mono">Ref: {error.digest}</p>}
      <button type="button" className="btn btn-primary btn-sm" onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}
