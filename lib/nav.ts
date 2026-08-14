import type { IconName } from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  hrOnly?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "grid" }],
  },
  {
    label: "Recognition",
    items: [
      { href: "/eom", label: "Employee of the Month", icon: "trophy" },
      { href: "/leaderboard", label: "Leaderboard", icon: "list", hrOnly: true },
      { href: "/badges", label: "Badges & Achievements", icon: "award" },
    ],
  },
  {
    label: "My Growth",
    items: [
      { href: "/performance", label: "My Performance", icon: "target" },
      { href: "/tasks", label: "My Tasks", icon: "file" },
      { href: "/kpi", label: "KPI & KRA", icon: "bars" },
    ],
  },
  {
    label: "Attendance",
    items: [{ href: "/attendance", label: "My Attendance", icon: "clock" }],
  },
  {
    label: "Learning",
    items: [
      { href: "/learning", label: "Learning & Development", icon: "book" },
      { href: "/quiz", label: "Quiz", icon: "quiz" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile", label: "My Profile", icon: "user" },
      { href: "/notifications", label: "Notifications", icon: "bell" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin", label: "HR Admin", icon: "shield" },
      { href: "/admin/live-tracking", label: "Live Tracking", icon: "map", hrOnly: true },
      { href: "/admin/offices", label: "Offices", icon: "building", hrOnly: true },
      { href: "/admin/corrections", label: "Corrections", icon: "file", hrOnly: true },
    ],
  },
];
