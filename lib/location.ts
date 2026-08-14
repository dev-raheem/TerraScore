import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertHr } from "@/lib/actions/guard";
import { derivePresenceStatus, type AttendanceStatus, type PresenceStatus } from "@/lib/geofence";

const POLICY_ID = "00000000-0000-0000-0000-000000000001";

export type LiveOfficeSummary = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

export type LiveEmployeeLocation = {
  employee_id: string;
  full_name: string;
  department: string | null;
  designation: string | null;
  office_id: string | null;
  office_name: string | null;
  attendance_status: AttendanceStatus;
  presence_status: PresenceStatus;
  is_actively_tracked: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distance_meters: number | null;
  last_updated_at: string | null;
  clock_in_at: string | null;
  clock_out_at: string | null;
};

type RawAttendanceRow = { employee_id: string; work_date: string; status: string; clock_in_at: string | null; clock_out_at: string | null };
type RawCurrentLocationRow = {
  employee_id: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distance_meters: number | null;
  presence_status: string;
  updated_at: string;
};

// The actual query logic, separate from the "use server" entry point in
// lib/actions/liveTracking.ts (which the admin dashboard polls on an
// interval) — kept here so it's callable directly from a Server Component
// render too without going through the Server Action RPC path.
export async function loadLiveLocations(): Promise<{ offices: LiveOfficeSummary[]; employees: LiveEmployeeLocation[] }> {
  const admin = createAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - 1);
  const sinceWorkDate = since.toISOString().slice(0, 10);

  const [employeesRes, locationsRes, attendanceRes, officesRes, policyRes] = await Promise.all([
    admin.from("ts_employees").select("id, full_name, department, designation, office_id").eq("status", "active"),
    admin.from("ts_employee_current_locations").select("*"),
    admin.from("ts_attendance").select("employee_id, work_date, status, clock_in_at, clock_out_at").gte("work_date", sinceWorkDate),
    admin.from("ts_offices").select("id, name, latitude, longitude, radius_meters").eq("status", "active"),
    admin.from("ts_attendance_policies").select("stale_after_seconds").eq("id", POLICY_ID).single(),
  ]);

  const staleAfterSeconds = policyRes.data?.stale_after_seconds ?? 900;

  const locationByEmployee = new Map<string, RawCurrentLocationRow>(
    ((locationsRes.data as RawCurrentLocationRow[] | null) ?? []).map((row) => [row.employee_id, row])
  );
  const officeById = new Map((officesRes.data ?? []).map((row) => [row.id as string, row]));

  const latestAttendanceByEmployee = new Map<string, RawAttendanceRow>();
  for (const row of (attendanceRes.data as RawAttendanceRow[] | null) ?? []) {
    const existing = latestAttendanceByEmployee.get(row.employee_id);
    if (!existing || row.work_date > existing.work_date) latestAttendanceByEmployee.set(row.employee_id, row);
  }

  const employees: LiveEmployeeLocation[] = (employeesRes.data ?? []).map((employee) => {
    const attendance = latestAttendanceByEmployee.get(employee.id as string);
    const location = locationByEmployee.get(employee.id as string);
    const office = employee.office_id ? officeById.get(employee.office_id as string) : undefined;

    const presenceStatus = derivePresenceStatus(
      location?.presence_status as PresenceStatus | undefined,
      location?.updated_at,
      staleAfterSeconds
    );

    return {
      employee_id: employee.id as string,
      full_name: employee.full_name as string,
      department: employee.department as string | null,
      designation: employee.designation as string | null,
      office_id: employee.office_id as string | null,
      office_name: office?.name ?? null,
      attendance_status: (attendance?.status as AttendanceStatus) ?? "NOT_STARTED",
      presence_status: presenceStatus,
      is_actively_tracked: Boolean(attendance?.clock_in_at && !attendance?.clock_out_at),
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      accuracy: location?.accuracy ?? null,
      distance_meters: location?.distance_meters ?? null,
      last_updated_at: location?.updated_at ?? null,
      clock_in_at: attendance?.clock_in_at ?? null,
      clock_out_at: attendance?.clock_out_at ?? null,
    };
  });

  const offices: LiveOfficeSummary[] = (officesRes.data ?? []).map((o) => ({
    id: o.id as string,
    name: o.name as string,
    latitude: o.latitude as number,
    longitude: o.longitude as number,
    radius_meters: o.radius_meters as number,
  }));

  return { offices, employees };
}

export type EmployeeCurrentLocation = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distance_meters: number | null;
  presence_status: PresenceStatus;
  updated_at: string;
} | null;

export async function getEmployeeCurrentLocation(employeeId: string): Promise<EmployeeCurrentLocation> {
  await assertHr();
  const admin = createAdminClient();
  const { data } = await admin.from("ts_employee_current_locations").select("*").eq("employee_id", employeeId).maybeSingle();
  return (data as EmployeeCurrentLocation) ?? null;
}

export type LocationHistoryPoint = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  distance_meters: number | null;
  presence_status: PresenceStatus;
  server_received_at: string;
};

// Every call logs who looked at this employee's precise location history —
// this is the actual point of sensitive-data access, so it re-checks HR
// authorization and writes the audit row itself rather than trusting the
// calling page's requireHr() alone.
export async function getEmployeeLocationHistory(employeeId: string, limit = 200): Promise<LocationHistoryPoint[]> {
  const viewerId = await assertHr();
  const admin = createAdminClient();

  await admin.from("ts_location_access_audit").insert({ viewer_id: viewerId, employee_id: employeeId });

  const { data } = await admin
    .from("ts_location_events")
    .select("id, latitude, longitude, accuracy, distance_meters, presence_status, server_received_at")
    .eq("employee_id", employeeId)
    .order("server_received_at", { ascending: false })
    .limit(limit);

  return (data as LocationHistoryPoint[] | null) ?? [];
}

export async function getEmployeeAttendanceEvents(employeeId: string, limit = 100) {
  await assertHr();
  const admin = createAdminClient();
  const { data } = await admin
    .from("ts_attendance_events")
    .select("*")
    .eq("employee_id", employeeId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
