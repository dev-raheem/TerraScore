// Pure helpers shared by the attendance/location Server Actions and read
// helpers. No Supabase imports here — keep this file trivially testable.

export type AttendanceStatus = "NOT_STARTED" | "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "PENDING" | "CORRECTED";

export type PresenceStatus = "IN_OFFICE" | "OUT_OF_OFFICE" | "UNCERTAIN" | "LOCATION_UNAVAILABLE" | "LOCATION_STALE";

export type AttendanceEventType =
  | "CLOCK_IN"
  | "CLOCK_OUT"
  | "ENTERED_OFFICE"
  | "LEFT_OFFICE"
  | "LOCATION_UNAVAILABLE"
  | "LOCATION_STALE"
  | "SUSPICIOUS_LOCATION"
  | "CORRECTION_REQUESTED"
  | "CORRECTION_APPROVED"
  | "CORRECTION_REJECTED";

const EARTH_RADIUS_METERS = 6371000;

// Haversine distance between two points, in meters. Used for the
// movement-threshold check (should we write a new location_events row) and
// the impossible-travel anomaly check — the office-relative distance itself
// always comes from the ts_evaluate_geofence RPC (PostGIS), not this.
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

// A speed threshold no ordinary commute/travel between two GPS pings should
// exceed — flags mock-GPS/teleporting locations as a review signal, never an
// automatic penalty.
const SUSPICIOUS_SPEED_KMH = 200;

export function isSuspiciousJump(
  prev: { lat: number; lng: number; at: Date },
  next: { lat: number; lng: number; at: Date }
): boolean {
  const seconds = (next.at.getTime() - prev.at.getTime()) / 1000;
  if (seconds <= 0) return false;
  const meters = haversineMeters(prev.lat, prev.lng, next.lat, next.lng);
  const kmh = (meters / seconds) * 3.6;
  return kmh > SUSPICIOUS_SPEED_KMH;
}

// Calendar "work date" for attendance grouping, computed from the server
// clock (never the client's) in the office's own timezone so a 12:30am
// clock-in in Varanasi and one in a different timezone land on the correct
// local day.
export function getWorkDate(timezone: string, at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function computeWorkingSeconds(clockInAt: string, now: Date = new Date()): number {
  return Math.max(0, Math.round((now.getTime() - new Date(clockInAt).getTime()) / 1000));
}

// Pairs LEFT_OFFICE/ENTERED_OFFICE events (ascending order) into out-of-office
// spans and sums them — shared by clockOut (final tally, session already
// closed) and the admin employee detail page (live tally, session still open
// so the trailing span runs up to `endAt` instead of a CLOCK_OUT event).
export function sumOutOfOfficeSeconds(events: Array<{ event_type: string; occurred_at: string }>, endAt: Date): number {
  let totalMs = 0;
  let leftAt: number | null = null;
  for (const event of events) {
    const at = new Date(event.occurred_at).getTime();
    if (event.event_type === "LEFT_OFFICE") {
      leftAt = at;
    } else if (event.event_type === "ENTERED_OFFICE" && leftAt != null) {
      totalMs += at - leftAt;
      leftAt = null;
    }
  }
  if (leftAt != null) totalMs += endAt.getTime() - leftAt;
  return Math.max(0, Math.round(totalMs / 1000));
}

// Zero-padded 24-hour "HH:MM:SS" in a given IANA timezone — lexicographically
// comparable against the `time`-typed attendance_cutoff_time column, so the
// cutoff cron can check "is it past cutoff in this office's own timezone"
// with a plain string comparison instead of juggling Date math per office.
export function getLocalTimeString(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}:${get("second")}`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatDistance(meters: number | null): string {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// These pages render on the server, where the process timezone is whatever
// the host (Vercel = UTC) uses — never the visitor's. Plain toLocaleTimeString()
// there silently shows UTC instead of the employee's local time, so every
// server-rendered clock/date must go through one of these instead.
export function formatTimeInZone(iso: string | null, timezone: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function formatDateTimeInZone(iso: string | null, timezone: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatDateInZone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "numeric", day: "numeric" }).format(
    new Date(iso)
  );
}

// Staleness is relative to "now", so it's derived at read time rather than
// stored — shared by the admin live-locations feed and an employee's own
// current-location view so the two never disagree on what counts as stale.
export function derivePresenceStatus(
  rawStatus: PresenceStatus | null | undefined,
  updatedAt: string | null | undefined,
  staleAfterSeconds: number
): PresenceStatus {
  if (!rawStatus || !updatedAt) return "LOCATION_UNAVAILABLE";
  const isStale = Date.now() - new Date(updatedAt).getTime() > staleAfterSeconds * 1000;
  return isStale ? "LOCATION_STALE" : rawStatus;
}

export function formatTimeAgo(iso: string | null, timezone: string = "Asia/Kolkata"): string {
  if (!iso) return "—";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDateInZone(iso, timezone);
}
