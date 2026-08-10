"use client";

import { useTheme } from "@/lib/theme";

export default function ThemeModeButton() {
  const { theme, toggle } = useTheme();
  return (
    <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} onClick={toggle}>
      <span>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</span>
    </button>
  );
}
