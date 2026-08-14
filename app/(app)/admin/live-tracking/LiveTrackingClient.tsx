"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import { AttendancePill, PresencePill } from "@/components/attendance/StatusPill";
import { formatDistance, formatTimeAgo } from "@/lib/geofence";
import { getLiveLocations } from "@/lib/actions/liveTracking";
import type { LiveEmployeeLocation, LiveOfficeSummary } from "@/lib/location";

const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

const POLL_INTERVAL_MS = 20_000;

type PresenceFilter = "ALL" | "IN_OFFICE" | "OUT_OF_OFFICE" | "LOCATION_UNAVAILABLE" | "ACTIVE_TRACKING";

const FILTERS: Array<[PresenceFilter, string]> = [
  ["ALL", "All"],
  ["IN_OFFICE", "In Office"],
  ["OUT_OF_OFFICE", "Outside"],
  ["LOCATION_UNAVAILABLE", "Unavailable"],
  ["ACTIVE_TRACKING", "Active Tracking"],
];

export default function LiveTrackingClient({
  initialOffices,
  initialEmployees,
}: {
  initialOffices: LiveOfficeSummary[];
  initialEmployees: LiveEmployeeLocation[];
}) {
  const [offices, setOffices] = useState(initialOffices);
  const [employees, setEmployees] = useState(initialEmployees);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PresenceFilter>("ALL");

  // Polling refreshes the whole employee list from one lightweight cache-table
  // read, but React only re-renders the markers/rows whose data actually
  // changed — an unrelated employee moving doesn't force a full remount of
  // everyone else.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const result = await getLiveLocations();
      if (cancelled) return;
      setOffices(result.offices);
      setEmployees(result.employees);
    };
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (query && !e.full_name.toLowerCase().includes(query)) return false;
      if (filter === "ALL") return true;
      if (filter === "ACTIVE_TRACKING") return e.is_actively_tracked;
      return e.presence_status === filter;
    });
  }, [employees, search, filter]);

  const metrics = useMemo(
    () => ({
      total: employees.length,
      inOffice: employees.filter((e) => e.presence_status === "IN_OFFICE").length,
      outOfOffice: employees.filter((e) => e.presence_status === "OUT_OF_OFFICE").length,
      unavailable: employees.filter((e) => e.presence_status === "LOCATION_UNAVAILABLE" || e.presence_status === "LOCATION_STALE")
        .length,
    }),
    [employees]
  );

  return (
    <>
      <div className="grid g4" style={{ gap: 12, marginBottom: 18 }}>
        <StatCard label="Total employees" value={metrics.total} />
        <StatCard label="In office now" value={metrics.inOffice} sub="🟢 IN_OFFICE" />
        <StatCard label="Out of office now" value={metrics.outOfOffice} sub="🟠 OUT_OF_OFFICE" />
        <StatCard label="Location unavailable" value={metrics.unavailable} sub="⚪ unavailable / stale" />
      </div>

      <div className="flex gap10 center" style={{ marginBottom: 12, flexWrap: "wrap" }}>
        <input
          className="field"
          style={{ maxWidth: 260 }}
          placeholder="Search employee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`btn btn-sm ${filter === value ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid g12-8-4" style={{ gap: 18, alignItems: "stretch" }}>
        <div className="card" style={{ height: 560, padding: 0, overflow: "hidden" }}>
          <LiveMap
            offices={offices}
            employees={filtered}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={setSelectedEmployeeId}
          />
        </div>

        <div className="card pad" style={{ height: 560, overflowY: "auto" }}>
          <div className="bold" style={{ marginBottom: 10 }}>
            Employees ({filtered.length})
          </div>
          <div className="flex col gap8">
            {filtered.map((employee) => (
              <button
                key={employee.employee_id}
                type="button"
                onClick={() => setSelectedEmployeeId(employee.employee_id)}
                className="card-flat pad"
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                  border: employee.employee_id === selectedEmployeeId ? "1px solid var(--primary)" : undefined,
                }}
              >
                <div className="flex between center">
                  <span className="bold small">{employee.full_name}</span>
                  <Link
                    href={`/admin/employees/${employee.employee_id}`}
                    className="tiny"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Details →
                  </Link>
                </div>
                <div className="tiny muted">{employee.department ?? "—"}</div>
                <div className="flex gap6" style={{ marginTop: 6, flexWrap: "wrap" }}>
                  <AttendancePill status={employee.attendance_status} />
                  <PresencePill status={employee.presence_status} />
                </div>
                <div className="tiny muted" style={{ marginTop: 6 }}>
                  {formatDistance(employee.distance_meters)} · Updated {formatTimeAgo(employee.last_updated_at)}
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="tiny muted">No employees match this filter.</div>}
          </div>
        </div>
      </div>
    </>
  );
}
