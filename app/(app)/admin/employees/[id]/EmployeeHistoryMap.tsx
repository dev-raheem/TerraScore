"use client";

import "leaflet/dist/leaflet.css";
import "@/lib/leafletZoomFix";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import { formatDistance } from "@/lib/geofence";
import type { LocationHistoryPoint } from "@/lib/location";
import type { LiveOfficeSummary } from "@/lib/location";

type Props = {
  office: LiveOfficeSummary | null;
  points: LocationHistoryPoint[];
};

export default function EmployeeHistoryMap({ office, points }: Props) {
  // Points arrive most-recent-first (for the timeline list) — reverse to
  // oldest-first so the route line is drawn in the order it was walked.
  const ordered = [...points].reverse();
  const center: [number, number] = office
    ? [office.latitude, office.longitude]
    : ordered[0]
      ? [ordered[0].latitude, ordered[0].longitude]
      : [25.3176, 82.9739];

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {office && (
        <>
          <Marker position={[office.latitude, office.longitude]}>
            <Popup>🏢 {office.name}</Popup>
          </Marker>
          <Circle
            center={[office.latitude, office.longitude]}
            radius={office.radius_meters}
            pathOptions={{ color: "#0E6B73", fillColor: "#0E6B73", fillOpacity: 0.12 }}
          />
        </>
      )}

      {ordered.length > 1 && (
        <Polyline positions={ordered.map((p) => [p.latitude, p.longitude])} pathOptions={{ color: "#C49850", weight: 3 }} />
      )}

      {ordered.map((point) => (
        <Marker key={point.id} position={[point.latitude, point.longitude]}>
          <Popup>
            <div className="tiny">{new Date(point.server_received_at).toLocaleString()}</div>
            <div className="tiny">{formatDistance(point.distance_meters)} from office</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
