import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/session";
import {
  getAttendanceHistory,
  getAttendancePolicy,
  getOffices,
  getOwnCorrectionRequests,
  getOwnCurrentLocation,
  getTodayAttendance,
} from "@/lib/attendance";
import {
  computeWorkingSeconds,
  derivePresenceStatus,
  formatDistance,
  formatDuration,
  formatTimeAgo,
  formatTimeInZone,
} from "@/lib/geofence";
import { AttendancePill, PresencePill } from "@/components/attendance/StatusPill";
import ClockButton from "./ClockButton";
import ConsentPrompt from "./ConsentPrompt";
import TrackingClient from "./TrackingClient";
import CorrectionForm from "./CorrectionForm";

export const metadata: Metadata = { title: "My Attendance" };

export default async function AttendancePage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const [today, history, corrections, offices, policy, currentLocation] = await Promise.all([
    getTodayAttendance(employee.id, employee.office_id),
    getAttendanceHistory(employee.id, 14),
    getOwnCorrectionRequests(employee.id),
    getOffices(),
    getAttendancePolicy(),
    getOwnCurrentLocation(employee.id),
  ]);

  const office = offices.find((o) => o.id === employee.office_id) ?? null;
  const timezone = office?.timezone ?? "Asia/Kolkata";
  const hasConsent = Boolean(employee.location_tracking_consent_at);
  const isActiveSession = Boolean(today?.clock_in_at && !today?.clock_out_at);
  const presenceStatus = derivePresenceStatus(
    currentLocation?.presence_status,
    currentLocation?.updated_at,
    policy.stale_after_seconds
  );

  const workingSeconds =
    today?.clock_in_at && !today?.clock_out_at
      ? computeWorkingSeconds(today.clock_in_at)
      : today?.total_working_seconds ?? 0;

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">My Attendance</div>
          <div className="page-sub">
            {office ? `Assigned office: ${office.name} · ${office.radius_meters}m geofence` : "No office assigned yet"}
          </div>
        </div>
      </div>

      <TrackingClient
        active={isActiveSession && hasConsent}
        normalIntervalSeconds={policy.normal_interval_seconds}
        lowBatteryIntervalSeconds={policy.low_battery_interval_seconds}
      />

      <div className="card pad-lg enter" style={{ marginBottom: 18 }}>
        <div className="flex between center" style={{ marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div className="flex gap10 center" style={{ flexWrap: "wrap" }}>
            <AttendancePill status={today?.status ?? "NOT_STARTED"} />
            {isActiveSession && <PresencePill status={presenceStatus} />}
          </div>
          {!today?.clock_in_at ? (
            <ClockButton mode="in" />
          ) : !today?.clock_out_at ? (
            <ClockButton mode="out" />
          ) : (
            <span className="tiny muted">Done for today</span>
          )}
        </div>

        <div className="grid g4" style={{ gap: 12 }}>
          <div>
            <div className="tiny muted">Clock in</div>
            <div className="bold">{formatTimeInZone(today?.clock_in_at ?? null, timezone)}</div>
          </div>
          <div>
            <div className="tiny muted">Clock out</div>
            <div className="bold">{formatTimeInZone(today?.clock_out_at ?? null, timezone)}</div>
          </div>
          <div>
            <div className="tiny muted">Working time</div>
            <div className="bold">{formatDuration(workingSeconds)}</div>
          </div>
          <div>
            <div className="tiny muted">Distance from office</div>
            <div className="bold">{isActiveSession ? formatDistance(currentLocation?.distance_meters ?? null) : "—"}</div>
          </div>
        </div>

        {isActiveSession && hasConsent && (
          <div className="tiny muted" style={{ marginTop: 12 }}>
            Last location update: {formatTimeAgo(currentLocation?.updated_at ?? null, timezone)}
          </div>
        )}
      </div>

      {!hasConsent && (
        <div style={{ marginBottom: 18 }}>
          <ConsentPrompt />
        </div>
      )}

      <div className="card pad-lg enter" style={{ marginBottom: 18 }}>
        <div className="bold" style={{ marginBottom: 12 }}>Recent attendance</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Clock in</th>
              <th>Clock out</th>
              <th>Working time</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr className="row-hover" key={row.id}>
                <td>{row.work_date}</td>
                <td>
                  <AttendancePill status={row.status} />
                </td>
                <td>{formatTimeInZone(row.clock_in_at, timezone)}</td>
                <td>{formatTimeInZone(row.clock_out_at, timezone)}</td>
                <td>{formatDuration(row.total_working_seconds)}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="muted small" style={{ padding: 20, textAlign: "center" }}>
                  No attendance recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid g2" style={{ gap: 18, alignItems: "start" }}>
        <CorrectionForm />

        <div className="card pad-lg">
          <div className="bold" style={{ marginBottom: 12 }}>My correction requests</div>
          {corrections.length === 0 && <div className="tiny muted">No requests submitted yet.</div>}
          <div className="flex col gap10">
            {corrections.map((request) => (
              <div key={request.id} className="card-flat pad" style={{ display: "grid", gap: 4 }}>
                <div className="flex between center">
                  <span className="bold small">{request.work_date}</span>
                  <span
                    className={`pill tiny ${
                      request.status === "APPROVED" ? "pill-emerald" : request.status === "REJECTED" ? "pill-coral" : "pill-gold"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
                <div className="tiny muted">{request.request_type.replaceAll("_", " ")}</div>
                <div className="tiny">{request.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
