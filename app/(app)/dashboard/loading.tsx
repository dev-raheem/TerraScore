import { SkeletonBlock, SkeletonCircle, SkeletonPanel } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <>
      <div className="page-head">
        <div>
          <SkeletonBlock width={220} height={26} />
          <SkeletonBlock width={300} height={14} style={{ marginTop: 10 }} />
        </div>
        <SkeletonBlock width={160} height={36} radius={10} />
      </div>

      <div className="grid g4" style={{ marginBottom: 18 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card pad flex col gap8">
            <SkeletonBlock width={90} height={11} />
            <SkeletonBlock width={70} height={24} />
            <SkeletonBlock width={110} height={11} />
          </div>
        ))}
      </div>

      <div className="grid g12-8-4" style={{ marginBottom: 18, alignItems: "stretch" }}>
        <SkeletonPanel height={190} />
        <div className="card pad-lg flex col center" style={{ justifyContent: "center", alignItems: "center" }}>
          <SkeletonCircle size={150} />
        </div>
      </div>

      <SkeletonPanel height={260} />
    </>
  );
}
