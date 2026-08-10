"use client";

import { useId } from "react";

type LineChartProps = {
  data: number[];
  labels: string[];
  width: number;
  height: number;
  color: string;
};

export default function LineChart({ data, labels, width: w, height: h, color }: LineChartProps) {
  const gradId = useId();
  const max = Math.max(...data) + 5;
  const min = Math.min(...data) - 8;
  const stepX = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = path + ` L${w},${h} L0,${h} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 26}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="4.5" fill={color} stroke="var(--surface-solid)" strokeWidth="2" />
      ))}
      {labels.map((l, i) => (
        <text key={l} x={pts[i][0]} y={h + 18} fontSize="11" fill="var(--ink-faint)" textAnchor="middle">
          {l}
        </text>
      ))}
    </svg>
  );
}
