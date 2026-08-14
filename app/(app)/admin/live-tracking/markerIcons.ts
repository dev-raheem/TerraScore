// Only ever imported from LiveMap.tsx, which is loaded with next/dynamic
// ssr:false — leaflet touches `window` at module scope, so this file must
// never be reachable from server-rendered code.
import L from "leaflet";
import type { PresenceStatus } from "@/lib/geofence";

const PRESENCE_COLORS: Record<PresenceStatus, string> = {
  IN_OFFICE: "#189267",
  OUT_OF_OFFICE: "#C49850",
  UNCERTAIN: "#0E7A85",
  LOCATION_UNAVAILABLE: "#8FA6A4",
  LOCATION_STALE: "#8FA6A4",
};

export function presenceIcon(presenceStatus: PresenceStatus, selected: boolean): L.DivIcon {
  const color = PRESENCE_COLORS[presenceStatus] ?? "#8FA6A4";
  const size = selected ? 22 : 16;
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function officeIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="font-size:24px;line-height:1;">🏢</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
  });
}
