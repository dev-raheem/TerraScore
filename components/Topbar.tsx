"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Icon } from "@/components/icons";
import { initials } from "@/lib/data";
import { useMobileNav } from "@/components/MobileNavContext";

export default function Topbar({
  name,
  subtitle,
  unreadNotifications,
}: {
  name: string;
  subtitle: string;
  unreadNotifications: number;
}) {
  const { toggle } = useMobileNav();

  return (
    <div className="topbar">
      <div className="flex center gap12">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={toggle}
          aria-label="Open menu"
        >
          <Icon name="menu" style={{ width: 20, height: 20 }} />
        </button>
        <div
          className="avatar"
          style={{ width: 38, height: 38, background: "linear-gradient(135deg,var(--primary),var(--primary-2))" }}
        >
          {initials(name)}
        </div>
        <div>
          <div className="bold" style={{ fontSize: 14.5 }}>{name}</div>
          <div className="tiny muted">{subtitle}</div>
        </div>
      </div>
      <div className="flex center gap16">
        <ThemeToggle />
        <Link href="/notifications" style={{ position: "relative" }}>
          <Icon name="bell" style={{ width: 20, height: 20, cursor: "pointer" }} />
          {unreadNotifications > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--coral)",
              }}
              className="pulse-dot"
            />
          )}
        </Link>
      </div>
    </div>
  );
}
