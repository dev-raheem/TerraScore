"use client";

import { useState } from "react";
import type { Office } from "@/lib/attendance";
import EditOfficeModal from "./EditOfficeModal";

export default function OfficeTable({ offices }: { offices: Office[] }) {
  const [editing, setEditing] = useState<Office | null>(null);

  return (
    <div className="card pad-lg enter enter-d1" style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Coordinates</th>
            <th>Geofence radius</th>
            <th>Timezone</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {offices.map((office) => (
            <tr key={office.id} className="row-hover">
              <td className="bold">🏢 {office.name}</td>
              <td className="small">{office.address ?? "—"}</td>
              <td className="mono small">
                {office.latitude.toFixed(5)}, {office.longitude.toFixed(5)}
              </td>
              <td className="small">{office.radius_meters}m</td>
              <td className="small">{office.timezone}</td>
              <td>
                <span className={`pill ${office.status === "active" ? "pill-emerald" : "pill-muted"}`}>{office.status}</span>
              </td>
              <td style={{ textAlign: "right" }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(office)}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
          {offices.length === 0 && (
            <tr>
              <td colSpan={7} className="muted small" style={{ padding: 20, textAlign: "center" }}>
                No offices yet — add your first one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && <EditOfficeModal office={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
