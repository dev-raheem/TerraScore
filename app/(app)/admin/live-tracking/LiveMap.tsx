"use client";

import "leaflet/dist/leaflet.css";
import "@/lib/leafletZoomFix";
import { Fragment, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { presenceIcon, officeIcon } from "./markerIcons";
import { AttendancePill, PresencePill } from "@/components/attendance/StatusPill";
import { formatDistance, formatTimeAgo } from "@/lib/geofence";
import type { LiveEmployeeLocation, LiveOfficeSummary } from "@/lib/location";

// Varanasi — used only as a fallback map center if no office exists yet.
const FALLBACK_CENTER: [number, number] = [25.3176, 82.9739];

function FlyToEmployee({ employee }: { employee: LiveEmployeeLocation | null }) {
  const map = useMap();
  // `employee` is a fresh object every poll (new array from the server
  // action) even when nothing changed, so keying off identity alone would
  // re-fly to the same spot every 20s. Only fly when the *selection* changes.
  const lastFlownId = useRef<string | null>(null);
  useEffect(() => {
    if (employee?.latitude == null || employee.longitude == null) {
      lastFlownId.current = null;
      return;
    }
    if (lastFlownId.current === employee.employee_id) return;
    lastFlownId.current = employee.employee_id;
    map.flyTo([employee.latitude, employee.longitude], 15, { duration: 0.6 });
  }, [employee, map]);
  return null;
}

type Props = {
  offices: LiveOfficeSummary[];
  employees: LiveEmployeeLocation[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
};

export default function LiveMap({ offices, employees, selectedEmployeeId, onSelectEmployee }: Props) {
  const center: [number, number] = offices[0] ? [offices[0].latitude, offices[0].longitude] : FALLBACK_CENTER;
  const selectedEmployee = employees.find((e) => e.employee_id === selectedEmployeeId) ?? null;

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {offices.map((office) => (
        <Fragment key={office.id}>
          <Marker position={[office.latitude, office.longitude]} icon={officeIcon()}>
            <Popup>
              <div className="bold">🏢 {office.name}</div>
              <div className="tiny muted">Geofence radius: {office.radius_meters}m</div>
            </Popup>
          </Marker>
          <Circle
            center={[office.latitude, office.longitude]}
            radius={office.radius_meters}
            pathOptions={{ color: "#0E6B73", fillColor: "#0E6B73", fillOpacity: 0.12 }}
          />
        </Fragment>
      ))}

      {employees
        .filter((e) => e.latitude != null && e.longitude != null)
        .map((employee) => (
          <Marker
            key={employee.employee_id}
            position={[employee.latitude as number, employee.longitude as number]}
            icon={presenceIcon(employee.presence_status, employee.employee_id === selectedEmployeeId)}
            eventHandlers={{ click: () => onSelectEmployee(employee.employee_id) }}
          >
            <Popup>
              <div style={{ minWidth: 190 }}>
                <div className="bold">{employee.full_name}</div>
                <div className="tiny muted" style={{ marginBottom: 6 }}>
                  {employee.department ?? "—"}
                </div>
                <div className="flex gap6" style={{ marginBottom: 6, flexWrap: "wrap" }}>
                  <AttendancePill status={employee.attendance_status} />
                  <PresencePill status={employee.presence_status} />
                </div>
                <div className="tiny">Distance: {formatDistance(employee.distance_meters)}</div>
                <div className="tiny">Accuracy: {employee.accuracy != null ? `${Math.round(employee.accuracy)}m` : "—"}</div>
                <div className="tiny">Updated: {formatTimeAgo(employee.last_updated_at)}</div>
                <div className="tiny">
                  Clock in: {employee.clock_in_at ? new Date(employee.clock_in_at).toLocaleTimeString() : "—"}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      <FlyToEmployee employee={selectedEmployee} />
    </MapContainer>
  );
}
