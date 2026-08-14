import type { AttendanceStatus, PresenceStatus } from "@/lib/geofence";

// Text label always accompanies the color — presence/status is never
// conveyed by color alone (accessibility).
const PRESENCE_META: Record<PresenceStatus, { label: string; pill: string }> = {
  IN_OFFICE: { label: "🟢 In Office", pill: "pill-emerald" },
  OUT_OF_OFFICE: { label: "🟠 Out of Office", pill: "pill-gold" },
  UNCERTAIN: { label: "🔵 Uncertain", pill: "pill-sky" },
  LOCATION_UNAVAILABLE: { label: "⚪ Location Unavailable", pill: "pill-muted" },
  LOCATION_STALE: { label: "⚪ Location Stale", pill: "pill-muted" },
};

export function PresencePill({ status }: { status: PresenceStatus }) {
  const meta = PRESENCE_META[status];
  return <span className={`pill ${meta.pill}`}>{meta.label}</span>;
}

const ATTENDANCE_META: Record<AttendanceStatus, { label: string; pill: string }> = {
  NOT_STARTED: { label: "Not Started", pill: "pill-muted" },
  PRESENT: { label: "Present", pill: "pill-emerald" },
  ABSENT: { label: "Absent", pill: "pill-coral" },
  HALF_DAY: { label: "Half Day", pill: "pill-gold" },
  ON_LEAVE: { label: "On Leave", pill: "pill-sky" },
  PENDING: { label: "Pending", pill: "pill-gold" },
  CORRECTED: { label: "Corrected", pill: "pill-primary" },
};

export function AttendancePill({ status }: { status: AttendanceStatus }) {
  const meta = ATTENDANCE_META[status];
  return <span className={`pill ${meta.pill}`}>{meta.label}</span>;
}
