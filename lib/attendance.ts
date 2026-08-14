import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertHr } from "@/lib/actions/guard";
import { getWorkDate, type AttendanceStatus, type PresenceStatus } from "@/lib/geofence";

export type Attendance = {
  id: string;
  employee_id: string;
  work_date: string;
  status: AttendanceStatus;
  office_id: string | null;
  clock_in_at: string | null;
  clock_in_distance_meters: number | null;
  clock_in_geofence_status: string | null;
  clock_out_at: string | null;
  clock_out_distance_meters: number | null;
  clock_out_geofence_status: string | null;
  total_working_seconds: number;
  total_out_of_office_seconds: number;
};

export type Office = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  address: string | null;
  timezone: string;
  status: "active" | "inactive";
};

export type CorrectionRequest = {
  id: string;
  employee_id: string;
  attendance_id: string | null;
  work_date: string;
  request_type: "FORGOT_CLOCK_IN" | "FORGOT_CLOCK_OUT" | "WRONG_TIME" | "OTHER";
  requested_clock_in_at: string | null;
  requested_clock_out_at: string | null;
  reason: string;
  comment: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

export type AttendancePolicy = {
  normal_interval_seconds: number;
  high_accuracy_interval_seconds: number;
  low_battery_interval_seconds: number;
  movement_threshold_meters: number;
  stale_after_seconds: number;
  attendance_cutoff_time: string;
  location_retention_days: number;
};

const DEFAULT_POLICY: AttendancePolicy = {
  normal_interval_seconds: 60,
  high_accuracy_interval_seconds: 30,
  low_battery_interval_seconds: 180,
  movement_threshold_meters: 100,
  stale_after_seconds: 900,
  attendance_cutoff_time: "11:00:00",
  location_retention_days: 90,
};

export async function getAttendancePolicy(): Promise<AttendancePolicy> {
  const supabase = await createClient();
  const { data } = await supabase.from("ts_attendance_policies").select("*").single();
  return (data as AttendancePolicy | null) ?? DEFAULT_POLICY;
}

export type CurrentLocation = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distance_meters: number | null;
  presence_status: PresenceStatus;
  updated_at: string;
} | null;

export async function getOwnCurrentLocation(employeeId: string): Promise<CurrentLocation> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ts_employee_current_locations")
    .select("*")
    .eq("employee_id", employeeId)
    .maybeSingle();
  return (data as CurrentLocation) ?? null;
}

export async function getOffices(): Promise<Office[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("ts_offices").select("*").order("name");
  return (data as Office[] | null) ?? [];
}

export async function getTodayAttendance(employeeId: string, officeId: string | null): Promise<Attendance | null> {
  const supabase = await createClient();

  let timezone = "Asia/Kolkata";
  if (officeId) {
    const { data: office } = await supabase.from("ts_offices").select("timezone").eq("id", officeId).single();
    timezone = office?.timezone ?? timezone;
  }

  const { data } = await supabase
    .from("ts_attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("work_date", getWorkDate(timezone))
    .maybeSingle();

  return (data as Attendance | null) ?? null;
}

export async function getAttendanceHistory(employeeId: string, limitDays = 30): Promise<Attendance[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ts_attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .order("work_date", { ascending: false })
    .limit(limitDays);
  return (data as Attendance[] | null) ?? [];
}

export async function getOwnCorrectionRequests(employeeId: string): Promise<CorrectionRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ts_attendance_correction_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  return (data as CorrectionRequest[] | null) ?? [];
}

// Cross-employee reads below use the admin client, same reasoning as
// getLeaderboard() in lib/leaderboard.ts: RLS only allows self-or-HR, but HR
// pages need every employee's rows to build a queue/history. Callers MUST be
// gated by requireHr()/assertHr() before rendering — enforced again here so
// this file can't accidentally be used from an ungated context.

export async function getPendingCorrections(): Promise<
  (CorrectionRequest & { full_name: string; department: string | null })[]
> {
  await assertHr();
  const admin = createAdminClient();
  const { data } = await admin
    .from("ts_attendance_correction_requests")
    .select("*, employee:employee_id(full_name, department)")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => {
    const { employee, ...rest } = row as CorrectionRequest & {
      employee: { full_name: string; department: string | null } | null;
    };
    return { ...rest, full_name: employee?.full_name ?? "Unknown", department: employee?.department ?? null };
  });
}

export async function getCorrectionAudits(requestId: string) {
  await assertHr();
  const admin = createAdminClient();
  const { data } = await admin
    .from("ts_attendance_correction_audits")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getEmployeeAttendanceHistoryForAdmin(employeeId: string, limitDays = 60): Promise<Attendance[]> {
  await assertHr();
  const admin = createAdminClient();
  const { data } = await admin
    .from("ts_attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .order("work_date", { ascending: false })
    .limit(limitDays);
  return (data as Attendance[] | null) ?? [];
}

export async function getEmployeeCorrectionsForAdmin(employeeId: string): Promise<CorrectionRequest[]> {
  await assertHr();
  const admin = createAdminClient();
  const { data } = await admin
    .from("ts_attendance_correction_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  return (data as CorrectionRequest[] | null) ?? [];
}
