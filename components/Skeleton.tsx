export function SkeletonBlock({
  width = "100%",
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonCircle({ size }: { size: number }) {
  return <div className="skeleton" style={{ width: size, height: size, borderRadius: "50%" }} />;
}

export function SkeletonPageHead() {
  return (
    <div className="page-head">
      <div>
        <SkeletonBlock width={220} height={26} />
        <SkeletonBlock width={300} height={14} style={{ marginTop: 10 }} />
      </div>
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid g4" style={{ marginBottom: 18 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card pad flex col gap8">
          <SkeletonBlock width={90} height={11} />
          <SkeletonBlock width={70} height={24} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPanel({ height = 220 }: { height?: number }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <SkeletonBlock height={height} radius={0} />
    </div>
  );
}
