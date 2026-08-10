export default function BarMini({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="progress-track" style={{ height: 6 }}>
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, background: color || "linear-gradient(90deg,var(--primary),var(--primary-2))" }}
      />
    </div>
  );
}
