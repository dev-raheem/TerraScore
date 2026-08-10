"use client";

import { useEffect } from "react";
import { useConfetti } from "@/lib/confetti-context";

export default function Celebrate({ auto }: { auto: boolean }) {
  const { burst } = useConfetti();

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(burst, 300);
    return () => clearTimeout(t);
  }, [auto, burst]);

  return (
    <button className="btn btn-primary btn-sm" onClick={burst}>
      🎉 Celebrate again
    </button>
  );
}
