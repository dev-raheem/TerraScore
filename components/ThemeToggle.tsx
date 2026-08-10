"use client";

import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { toggle } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
      <div className="knob" />
    </button>
  );
}
