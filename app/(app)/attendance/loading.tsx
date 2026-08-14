import { SkeletonBlock, SkeletonPanel } from "@/components/Skeleton";

export default function AttendanceLoading() {
  return (
    <>
      <div className="page-head">
        <div>
          <SkeletonBlock width={220} height={26} />
          <SkeletonBlock width={300} height={14} style={{ marginTop: 10 }} />
        </div>
      </div>
      <SkeletonPanel height={140} />
      <div style={{ marginTop: 18 }}>
        <SkeletonPanel height={220} />
      </div>
    </>
  );
}
