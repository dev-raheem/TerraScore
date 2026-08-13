import { SkeletonPageHead, SkeletonStatGrid, SkeletonPanel } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <SkeletonPageHead />
      <SkeletonStatGrid />
      <SkeletonPanel height={280} />
    </>
  );
}
