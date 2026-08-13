"use client";

import { useId } from "react";

type RingProps = {
  percent: number;
  size: number;
  strokeWidth: number;
  // Defaults to the theme's brand gradient, which flips light/dark via
  // CSS vars automatically — only pass an explicit pair to deviate from it
  // (e.g. the quiz page's gold ring), or dark mode's ring color won't match
  // the rest of the themed UI.
  colors?: [string, string];
  center: string | number;
  sub?: string;
};

export default function Ring({
  percent,
  size,
  strokeWidth,
  colors = ["var(--primary)", "var(--primary-2)"],
  center,
  sub,
}: RingProps) {
  const gradId = useId();
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (percent / 100) * c;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        className="ring-anim"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={strokeWidth} fill="none" />
        <circle
          className="fg"
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ "--full": c, "--off": off } as React.CSSProperties}
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="mono bold" style={{ fontSize: size * 0.22, lineHeight: 1 }}>
          {center}
        </div>
        {sub ? <div className="tiny muted" style={{ marginTop: 4 }}>{sub}</div> : null}
      </div>
    </div>
  );
}
