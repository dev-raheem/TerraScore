import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHr } from "@/lib/session";
import type { Employee } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import {
  getAttendancePolicy,
  getEmployeeAttendanceHistoryForAdmin,
  getEmployeeCorrectionsForAdmin,
  getOffices,
} from "@/lib/attendance";
import { getEmployeeAttendanceEvents, getEmployeeCurrentLocation, getEmployeeLocationHistory } from "@/lib/location";
import {
  computeWorkingSeconds,
  derivePresenceStatus,
  formatDistance,
  formatDuration,
  formatTimeAgo,
  sumOutOfOfficeSeconds,
} from "@/lib/geofence";
import { AttendancePill, PresencePill } from "@/components/attendance/StatusPill";
import CorrectionDecisionForm from "@/components/attendance/CorrectionDecisionForm";
import OfficeAssignmentForm from "./OfficeAssignmentForm";
import EmployeeHistoryMapLoader from "./EmployeeHistoryMapLoader";

export const metadata: Metadata = { title: "Employee Detail" };

const EVENT_LABELS: Record<string, string> = {
  CLOCK_IN: "Clocked in",
  CLOCK_OUT: "Clocked out",
  ENTERED_OFFICE: "Entered office",
  LEFT_OFFICE: "Left office",
  LOCATION_UNAVAILABLE: "Location unavailable",
  LOCATION_STALE: "Location stale",
  SUSPICIOUS_LOCATION: "⚠ Suspicious location signal",
  CORRECTION_REQUESTED: "Correction requested",
  CORRECTION_APPROVED: "Correction approved",
  CORRECTION_REJECTED: "Correction rejected",
};

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireHr();
  const { id } = await params;

  const supabase = await createClient();
  const { data: employeeData } = await supabase.from("ts_employees").select("*").eq("id", id).maybeSingle();
  if (!employeeData) notFound();
  const employee = employeeData as Employee;

  const [offices, policy, currentLocation, attendanceHistory, corrections, locationHistory, recentEvents] = await Promise.all([
    getOffices(),
    getAttendancePolicy(),
    getEmployeeCurrentLocation(employee.id),
    getEmployeeAttendanceHistoryForAdmin(employee.id, 30),
    getEmployeeCorrectionsForAdmin(employee.id),
    getEmployeeLocationHistory(employee.id, 100),
    getEmployeeAttendanceEvents(employee.id, 100),
  ]);

  const office = offices.find((o) => o.id === employee.office_id) ?? null;
  const today = attendanceHistory[0] ?? null;
  const isActiveSession = Boolean(today?.clock_in_at && !today?.clock_out_at);
  const presenceStatus = derivePresenceStatus(
    currentLocation?.presence_status,
    currentLocation?.updated_at,
    policy.stale_after_seconds
  );

  const todaysEvents = today ? recentEvents.filter((e) => e.attendance_id === today.id) : [];
  const timeline = [...todaysEvents].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
  const outOfOfficeSeconds = today
    ? isActiveSession
      ? sumOutOfOfficeSeconds(todaysEvents, new Date())
      : today.total_out_of_office_seconds
    : 0;
  const workingSeconds = today?.clock_in_at
    ? isActiveSession
      ? computeWorkingSeconds(today.clock_in_at)
      : today.total_working_seconds
    : 0;

  const pendingCorrections = corrections.filter((c) => c.status === "PENDING");
  const decidedCorrections = corrections.filter((c) => c.status !== "PENDING");

  return (
    <>
      <div className="page-head enter">
        <div>
          <Link href="/admin/employees" className="tiny muted">
            ← Back to employees
          </Link>
          <div className="page-title">{employee.full_name}</div>
          <div className="page-sub">{[employee.department, employee.designation].filter(Boolean).join(" · ") || "—"}</div>
        </div>
      </div>

      <div className="card pad-lg enter" style={{ marginBottom: 18 }}>
        <div className="flex gap10 center" style={{ marginBottom: 14, flexWrap: "wrap" }}>
          <AttendancePill status={today?.status ?? "NOT_STARTED"} />
          {isActiveSession && <PresencePill status={presenceStatus} />}
          {!employee.location_tracking_consent_at && <span className="pill pill-muted">Consent not granted</span>}
        </div>

        <div className="grid g4" style={{ gap: 12, marginBottom: 14 }}>
          <div>
            <div className="tiny muted">Clock in</div>
            <div className="bold">{today?.clock_in_at ? new Date(today.clock_in_at).toLocaleTimeString() : "—"}</div>
          </div>
          <div>
            <div className="tiny muted">Working time</div>
            <div className="bold">{formatDuration(workingSeconds)}</div>
          </div>
          <div>
            <div className="tiny muted">Out of office (today)</div>
            <div className="bold">{formatDuration(outOfOfficeSeconds)}</div>
          </div>
          <div>
            <div className="tiny muted">Distance from office</div>
            <div className="bold">{formatDistance(currentLocation?.distance_meters ?? null)}</div>
          </div>
        </div>

        <div className="tiny muted" style={{ marginBottom: 14 }}>
          Last location update: {formatTimeAgo(currentLocation?.updated_at ?? null)}
          {currentLocation?.accuracy != null ? ` · GPS accuracy ${Math.round(currentLocation.accuracy)}m` : ""}
        </div>

        <div>
          <div className="tiny muted" style={{ marginBottom: 6 }}>
            Assigned office
          </div>
          <OfficeAssignmentForm employeeId={employee.id} currentOfficeId={employee.office_id} offices={offices} />
        </div>
      </div>

      <div className="card pad-lg enter" style={{ marginBottom: 18 }}>
        <div className="bold" style={{ marginBottom: 12 }}>Today&apos;s timeline</div>
        {timeline.length === 0 && <div className="tiny muted">No events recorded today.</div>}
        <div className="flex col gap8">
          {timeline.map((event) => (
            <div key={event.id} className="flex gap10 center">
              <span className="mono tiny muted" style={{ minWidth: 70 }}>
                {new Date(event.occurred_at).toLocaleTimeString()}
              </span>
              <span className="small">{EVENT_LABELS[event.event_type] ?? event.event_type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card pad-lg enter" style={{ marginBottom: 18 }}>
        <div className="bold" style={{ marginBottom: 12 }}>Location history</div>
        <div className="grid g12-8-4" style={{ gap: 18, alignItems: "stretch" }}>
          <div className="card" style={{ height: 420, padding: 0, overflow: "hidden" }}>
            <EmployeeHistoryMapLoader
              office={
                office
                  ? { id: office.id, name: office.name, latitude: office.latitude, longitude: office.longitude, radius_meters: office.radius_meters }
                  : null
              }
              points={locationHistory}
            />
          </div>
          <div style={{ height: 420, overflowY: "auto" }}>
            {locationHistory.length === 0 && <div className="tiny muted">No location history recorded.</div>}
            <div className="flex col gap8">
              {locationHistory.map((point) => (
                <div key={point.id} className="card-flat pad">
                  <div className="tiny bold">{new Date(point.server_received_at).toLocaleString()}</div>
                  <div className="tiny muted">
                    {formatDistance(point.distance_meters)} from office · {point.presence_status.replaceAll("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card pad-lg enter" style={{ marginBottom: 18 }}>
        <div className="bold" style={{ marginBottom: 12 }}>Attendance history</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Clock in</th>
              <th>Clock out</th>
              <th>Working time</th>
              <th>Out of office</th>
            </tr>
          </thead>
          <tbody>
            {attendanceHistory.map((row) => (
              <tr className="row-hover" key={row.id}>
                <td>{row.work_date}</td>
                <td>
                  <AttendancePill status={row.status} />
                </td>
                <td>{row.clock_in_at ? new Date(row.clock_in_at).toLocaleTimeString() : "—"}</td>
                <td>{row.clock_out_at ? new Date(row.clock_out_at).toLocaleTimeString() : "—"}</td>
                <td>{formatDuration(row.total_working_seconds)}</td>
                <td>{formatDuration(row.total_out_of_office_seconds)}</td>
              </tr>
            ))}
            {attendanceHistory.length === 0 && (
              <tr>
                <td colSpan={6} className="muted small" style={{ padding: 20, textAlign: "center" }}>
                  No attendance recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card pad-lg enter">
        <div className="bold" style={{ marginBottom: 12 }}>Correction requests</div>
        {corrections.length === 0 && <div className="tiny muted">No correction requests from this employee.</div>}

        {pendingCorrections.length > 0 && (
          <div className="flex col gap10" style={{ marginBottom: decidedCorrections.length > 0 ? 18 : 0 }}>
            {pendingCorrections.map((request) => (
              <div key={request.id} className="card-flat pad" style={{ display: "grid", gap: 8 }}>
                <div className="flex between center">
                  <span className="bold small">{request.work_date}</span>
                  <span className="pill pill-gold tiny">PENDING</span>
                </div>
                <div className="tiny muted">{request.request_type.replaceAll("_", " ")}</div>
                <div className="tiny">{request.reason}</div>
                <CorrectionDecisionForm requestId={request.id} />
              </div>
            ))}
          </div>
        )}

        {decidedCorrections.length > 0 && (
          <div className="flex col gap8">
            {decidedCorrections.map((request) => (
              <div key={request.id} className="flex between center" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span className="small bold">{request.work_date}</span>{" "}
                  <span className="tiny muted">{request.request_type.replaceAll("_", " ")}</span>
                </div>
                <span className={`pill tiny ${request.status === "APPROVED" ? "pill-emerald" : "pill-coral"}`}>{request.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
