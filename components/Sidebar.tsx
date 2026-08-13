"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navGroups } from "@/lib/nav";
import { Icon } from "@/components/icons";
import { signOut } from "@/lib/actions/auth";
import { useMobileNav } from "@/components/MobileNavContext";

export default function Sidebar({ role }: { role: "hr" | "employee" }) {
  const pathname = usePathname();
  const groups = navGroups
    .filter((group) => group.label !== "Admin" || role === "hr")
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.hrOnly || role === "hr") }))
    .filter((group) => group.items.length > 0);
  const { open, close } = useMobileNav();

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={close} />}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="flex between center">
          <Link href="/dashboard" className="brand" onClick={close} style={{ flex: 1 }}>
            <div className="mark" style={{ position: "relative" }}>
              <Image src="/brand/terrarex-mark-tile.png" alt="TerraRex" fill className="object-cover" />
            </div>
            <span>TerraScore</span>
          </Link>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={close}
            aria-label="Close menu"
          >
            <Icon name="x" style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {groups.map((group) => (
          <div key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${pathname === item.href ? " active" : ""}`}
                onClick={close}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}

        <div style={{ flex: 1 }} />
        <div className="divider" />
        <form action={signOut}>
          <button
            type="submit"
            className="nav-item"
            style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", font: "inherit" }}
          >
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </form>
      </aside>
    </>
  );
}
