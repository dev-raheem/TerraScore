type Trend = {
  direction: "up" | "down" | "flat";
  label: string;
};

const trendPillClass: Record<Trend["direction"], string> = {
  up: "pill-emerald",
  down: "pill-coral",
  flat: "pill-primary",
};

const trendGlyph: Record<Trend["direction"], string> = {
  up: "↑",
  down: "↓",
  flat: "•",
};

export default function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  trend?: Trend;
}) {
  return (
    <div className="card pad flex col gap8">
      <div className="tiny muted bold">{label.toUpperCase()}</div>
      <div className="flex between" style={{ alignItems: "flex-end", gap: 8 }}>
        <div
          className="mono display"
          style={{ fontSize: 22, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>
        {trend && (
          <span className={`pill tiny ${trendPillClass[trend.direction]}`} style={{ flexShrink: 0 }}>
            {trendGlyph[trend.direction]} {trend.label}
          </span>
        )}
      </div>
      {sub && <div className="tiny muted">{sub}</div>}
    </div>
  );
}
