"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertHr, requireEmployeeId } from "@/lib/actions/guard";
import { getWorkDate, haversineMeters, isSuspiciousJump, sumOutOfOfficeSeconds, type PresenceStatus } from "@/lib/geofence";

const POLICY_ID = "00000000-0000-0000-0000-000000000001";

type AdminClient = ReturnType<typeof createAdminClient>;

async function evaluateGeofence(
  admin: AdminClient,
  lat: number | null,
  lng: number | null,
  accuracy: number | null,
  officeId: string | null
): Promise<{ distanceMeters: number | null; presenceStatus: PresenceStatus }> {
  if (lat == null || lng == null) {
    return { distanceMeters: null, presenceStatus: "LOCATION_UNAVAILABLE" };
  }
  const { data } = (await admin
    .rpc("ts_evaluate_geofence", { p_lat: lat, p_lng: lng, p_accuracy: accuracy, p_office_id: officeId })
    .single()) as { data: { distance_meters: number | null; presence_status: string } | null };
  return {
    distanceMeters: data?.distance_meters ?? null,
    presenceStatus: (data?.presence_status as PresenceStatus | undefined) ?? "LOCATION_UNAVAILABLE",
  };
}

async function getOfficeTimezone(admin: AdminClient, officeId: string | null): Promise<string> {
  if (!officeId) return "Asia/Kolkata";
  const { data } = await admin.from("ts_offices").select("timezone").eq("id", officeId).single();
  return data?.timezone ?? "Asia/Kolkata";
}

async function computeOutOfOfficeSeconds(admin: AdminClient, attendanceId: string, clockOutAtIso: string): Promise<number> {
  const { data: events } = await admin
    .from("ts_attendance_events")
    .select("event_type, occurred_at")
    .eq("attendance_id", attendanceId)
    .in("event_type", ["LEFT_OFFICE", "ENTERED_OFFICE"])
    .order("occurred_at", { ascending: true });

  return sumOutOfOfficeSeconds((events as { event_type: string; occurred_at: string }[] | null) ?? [], new Date(clockOutAtIso));
}

export type SimpleActionState = { error?: string } | undefined;

export type AttendanceActionState =
  | { error: string }
  | { error?: undefined; presenceStatus: PresenceStatus; distanceMeters: number | null }
  | undefined;

type GeoInput = { latitude: number | null; longitude: number | null; accuracy: number | null };

export async function clockIn(input: GeoInput): Promise<AttendanceActionState> {
  let employeeId: string;
  try {
    employeeId = await requireEmployeeId();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authenticated." };
  }

  const admin = createAdminClient();

  const { data: employee } = await admin
    .from("ts_employees")
    .select("office_id, location_tracking_consent_at")
    .eq("id", employeeId)
    .single();
  if (!employee) return { error: "Employee record not found." };

  const timezone = await getOfficeTimezone(admin, employee.office_id);
  const workDate = getWorkDate(timezone);

  const { data: existing } = await admin
    .from("ts_attendance")
    .select("id, clock_in_at")
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .maybeSingle();

  if (existing?.clock_in_at) return { error: "Already clocked in today." };

  const { distanceMeters, presenceStatus } = await evaluateGeofence(
    admin,
    input.latitude,
    input.longitude,
    input.accuracy,
    employee.office_id
  );

  const clockInFields = {
    clock_in_at: new Date().toISOString(),
    clock_in_latitude: input.latitude,
    clock_in_longitude: input.longitude,
    clock_in_accuracy: input.accuracy,
    clock_in_distance_meters: distanceMeters,
    clock_in_geofence_status: presenceStatus,
    office_id: employee.office_id,
  };

  let attendanceId: string;
  if (existing) {
    const { error } = await admin.from("ts_attendance").update({ ...clockInFields, status: "PRESENT" }).eq("id", existing.id);
    if (error) return { error: error.message };
    attendanceId = existing.id;
  } else {
    const { data: inserted, error } = await admin
      .from("ts_attendance")
      .insert({ employee_id: employeeId, work_date: workDate, status: "PRESENT", ...clockInFields })
      .select("id")
      .single();
    if (error || !inserted) return { error: error?.message ?? "Failed to clock in." };
    attendanceId = inserted.id;
  }

  await admin.from("ts_attendance_events").insert({
    employee_id: employeeId,
    attendance_id: attendanceId,
    event_type: "CLOCK_IN",
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    distance_meters: distanceMeters,
    office_id: employee.office_id,
  });

  if (employee.location_tracking_consent_at && input.latitude != null && input.longitude != null) {
    const now = new Date().toISOString();
    await admin.from("ts_employee_current_locations").upsert({
      employee_id: employeeId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      office_id: employee.office_id,
      distance_meters: distanceMeters,
      presence_status: presenceStatus,
      last_movement_at: now,
      updated_at: now,
    });
    await admin.from("ts_location_events").insert({
      employee_id: employeeId,
      attendance_id: attendanceId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      office_id: employee.office_id,
      distance_meters: distanceMeters,
      presence_status: presenceStatus,
      client_recorded_at: now,
    });
  }

  revalidatePath("/attendance");
  return { presenceStatus, distanceMeters };
}

export async function clockOut(input: GeoInput): Promise<AttendanceActionState> {
  let employeeId: string;
  try {
    employeeId = await requireEmployeeId();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authenticated." };
  }

  const admin = createAdminClient();

  const { data: employee } = await admin.from("ts_employees").select("office_id").eq("id", employeeId).single();
  if (!employee) return { error: "Employee record not found." };

  const timezone = await getOfficeTimezone(admin, employee.office_id);
  const workDate = getWorkDate(timezone);

  const { data: attendance } = await admin
    .from("ts_attendance")
    .select("id, clock_in_at, clock_out_at")
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .maybeSingle();

  if (!attendance?.clock_in_at) return { error: "You haven't clocked in today." };
  if (attendance.clock_out_at) return { error: "Already clocked out today." };

  const { distanceMeters, presenceStatus } = await evaluateGeofence(
    admin,
    input.latitude,
    input.longitude,
    input.accuracy,
    employee.office_id
  );

  const now = new Date();
  const workingSeconds = Math.max(0, Math.round((now.getTime() - new Date(attendance.clock_in_at).getTime()) / 1000));
  const outOfOfficeSeconds = await computeOutOfOfficeSeconds(admin, attendance.id, now.toISOString());

  const { error } = await admin
    .from("ts_attendance")
    .update({
      clock_out_at: now.toISOString(),
      clock_out_latitude: input.latitude,
      clock_out_longitude: input.longitude,
      clock_out_accuracy: input.accuracy,
      clock_out_distance_meters: distanceMeters,
      clock_out_geofence_status: presenceStatus,
      total_working_seconds: workingSeconds,
      total_out_of_office_seconds: outOfOfficeSeconds,
    })
    .eq("id", attendance.id);
  if (error) return { error: error.message };

  await admin.from("ts_attendance_events").insert({
    employee_id: employeeId,
    attendance_id: attendance.id,
    event_type: "CLOCK_OUT",
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    distance_meters: distanceMeters,
    office_id: employee.office_id,
  });

  revalidatePath("/attendance");
  return { presenceStatus, distanceMeters };
}

export async function grantLocationConsent(): Promise<SimpleActionState> {
  let employeeId: string;
  try {
    employeeId = await requireEmployeeId();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authenticated." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("ts_employees")
    .update({ location_tracking_consent_at: new Date().toISOString() })
    .eq("id", employeeId);
  if (error) return { error: error.message };

  revalidatePath("/attendance");
}

// Called on an interval from the client tracking hook while a session is
// open and consent is granted — not a form submission, so it takes a plain
// object rather than FormData.
export async function submitLocationPing(input: {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  clientRecordedAt: string;
}): Promise<AttendanceActionState> {
  let employeeId: string;
  try {
    employeeId = await requireEmployeeId();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authenticated." };
  }

  if (
    typeof input.latitude !== "number" ||
    typeof input.longitude !== "number" ||
    Math.abs(input.latitude) > 90 ||
    Math.abs(input.longitude) > 180
  ) {
    return { error: "Invalid coordinates." };
  }

  const admin = createAdminClient();

  const { data: employee } = await admin
    .from("ts_employees")
    .select("office_id, location_tracking_consent_at")
    .eq("id", employeeId)
    .single();
  if (!employee) return { error: "Employee record not found." };
  if (!employee.location_tracking_consent_at) return { error: "Location tracking consent required." };

  const timezone = await getOfficeTimezone(admin, employee.office_id);
  const workDate = getWorkDate(timezone);

  const { data: attendance } = await admin
    .from("ts_attendance")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .not("clock_in_at", "is", null)
    .is("clock_out_at", null)
    .maybeSingle();
  if (!attendance) return { error: "No active attendance session." };

  // Never trust the device clock outright: clamp an implausible
  // client-reported timestamp (future, or wildly stale) to the server's
  // receive time.
  const serverNow = new Date();
  let clientRecordedAt = new Date(input.clientRecordedAt);
  if (Number.isNaN(clientRecordedAt.getTime()) || clientRecordedAt.getTime() > serverNow.getTime() + 60_000) {
    clientRecordedAt = serverNow;
  }

  const { distanceMeters, presenceStatus } = await evaluateGeofence(
    admin,
    input.latitude,
    input.longitude,
    input.accuracy,
    employee.office_id
  );

  const { data: previous } = await admin
    .from("ts_employee_current_locations")
    .select("latitude, longitude, presence_status, updated_at")
    .eq("employee_id", employeeId)
    .maybeSingle();

  const { data: policy } = await admin
    .from("ts_attendance_policies")
    .select("movement_threshold_meters")
    .eq("id", POLICY_ID)
    .single();
  const movementThreshold = policy?.movement_threshold_meters ?? 100;

  const movedMeters =
    previous?.latitude != null && previous.longitude != null
      ? haversineMeters(previous.latitude, previous.longitude, input.latitude, input.longitude)
      : Infinity;

  const presenceChanged = previous?.presence_status !== presenceStatus;

  const { data: existingHistoryPoint } = await admin
    .from("ts_location_events")
    .select("id")
    .eq("attendance_id", attendance.id)
    .limit(1)
    .maybeSingle();

  // Only write a history row on a meaningful change — first ping of the
  // session, presence transition, or movement past the configured
  // threshold — never on every ping (see ts_attendance_policies).
  if (!existingHistoryPoint || movedMeters >= movementThreshold || presenceChanged) {
    await admin.from("ts_location_events").insert({
      employee_id: employeeId,
      attendance_id: attendance.id,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy,
      office_id: employee.office_id,
      distance_meters: distanceMeters,
      presence_status: presenceStatus,
      client_recorded_at: clientRecordedAt.toISOString(),
    });
  }

  await admin.from("ts_employee_current_locations").upsert({
    employee_id: employeeId,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.accuracy,
    office_id: employee.office_id,
    distance_meters: distanceMeters,
    presence_status: presenceStatus,
    last_movement_at: movedMeters >= movementThreshold ? serverNow.toISOString() : previous?.updated_at,
    updated_at: serverNow.toISOString(),
  });

  if (presenceChanged) {
    if (presenceStatus === "IN_OFFICE" && previous?.presence_status !== "IN_OFFICE") {
      await admin.from("ts_attendance_events").insert({
        employee_id: employeeId,
        attendance_id: attendance.id,
        event_type: "ENTERED_OFFICE",
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        distance_meters: distanceMeters,
        office_id: employee.office_id,
      });
    } else if (previous?.presence_status === "IN_OFFICE" && presenceStatus !== "IN_OFFICE") {
      await admin.from("ts_attendance_events").insert({
        employee_id: employeeId,
        attendance_id: attendance.id,
        event_type: "LEFT_OFFICE",
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        distance_meters: distanceMeters,
        office_id: employee.office_id,
      });
    }
  }

  if (previous?.latitude != null && previous.longitude != null && previous.updated_at) {
    const suspicious = isSuspiciousJump(
      { lat: previous.latitude, lng: previous.longitude, at: new Date(previous.updated_at) },
      { lat: input.latitude, lng: input.longitude, at: serverNow }
    );
    if (suspicious) {
      await admin.from("ts_attendance_events").insert({
        employee_id: employeeId,
        attendance_id: attendance.id,
        event_type: "SUSPICIOUS_LOCATION",
        latitude: input.latitude,
        longitude: input.longitude,
        accuracy: input.accuracy,
        distance_meters: distanceMeters,
        office_id: employee.office_id,
        metadata: { previous_latitude: previous.latitude, previous_longitude: previous.longitude },
      });
    }
  }

  return { presenceStatus, distanceMeters };
}

export async function requestCorrection(_prevState: SimpleActionState, formData: FormData): Promise<SimpleActionState> {
  let employeeId: string;
  try {
    employeeId = await requireEmployeeId();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authenticated." };
  }

  const workDate = String(formData.get("work_date") || "").trim();
  const requestType = String(formData.get("request_type") || "").trim();
  const requestedClockIn = String(formData.get("requested_clock_in_at") || "").trim() || null;
  const requestedClockOut = String(formData.get("requested_clock_out_at") || "").trim() || null;
  const reason = String(formData.get("reason") || "").trim();
  const comment = String(formData.get("comment") || "").trim() || null;

  if (!workDate) return { error: "Date is required." };
  if (!["FORGOT_CLOCK_IN", "FORGOT_CLOCK_OUT", "WRONG_TIME", "OTHER"].includes(requestType)) {
    return { error: "Invalid request type." };
  }
  if (!reason) return { error: "Reason is required." };

  const admin = createAdminClient();

  const { data: attendance } = await admin
    .from("ts_attendance")
    .select("id, status")
    .eq("employee_id", employeeId)
    .eq("work_date", workDate)
    .maybeSingle();

  const { data: inserted, error } = await admin
    .from("ts_attendance_correction_requests")
    .insert({
      employee_id: employeeId,
      attendance_id: attendance?.id ?? null,
      work_date: workDate,
      request_type: requestType,
      requested_clock_in_at: requestedClockIn,
      requested_clock_out_at: requestedClockOut,
      reason,
      comment,
    })
    .select("id")
    .single();
  if (error || !inserted) return { error: error?.message ?? "Failed to submit request." };

  await admin.from("ts_attendance_events").insert({
    employee_id: employeeId,
    attendance_id: attendance?.id ?? null,
    event_type: "CORRECTION_REQUESTED",
    metadata: { request_id: inserted.id, request_type: requestType },
  });

  if (attendance) {
    if (attendance.status === "NOT_STARTED" || attendance.status === "ABSENT") {
      await admin.from("ts_attendance").update({ status: "PENDING" }).eq("id", attendance.id);
    }
  } else {
    await admin.from("ts_attendance").insert({ employee_id: employeeId, work_date: workDate, status: "PENDING" });
  }

  revalidatePath("/attendance");
}

export async function approveCorrection(_prevState: SimpleActionState, formData: FormData): Promise<SimpleActionState> {
  let adminId: string;
  try {
    adminId = await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const requestId = String(formData.get("request_id") || "");
  const adminComment = String(formData.get("admin_comment") || "").trim() || null;
  if (!requestId) return { error: "Missing request." };

  const admin = createAdminClient();
  const { data: request } = await admin.from("ts_attendance_correction_requests").select("*").eq("id", requestId).single();
  if (!request) return { error: "Request not found." };
  if (request.status !== "PENDING") return { error: "This request has already been decided." };

  let attendanceId: string | null = request.attendance_id;
  let originalClockIn: string | null = null;
  let originalClockOut: string | null = null;

  if (attendanceId) {
    const { data: existingAttendance } = await admin
      .from("ts_attendance")
      .select("clock_in_at, clock_out_at")
      .eq("id", attendanceId)
      .single();
    originalClockIn = existingAttendance?.clock_in_at ?? null;
    originalClockOut = existingAttendance?.clock_out_at ?? null;
  }

  const finalClockIn = request.requested_clock_in_at ?? originalClockIn;
  const finalClockOut = request.requested_clock_out_at ?? originalClockOut;

  if (attendanceId) {
    await admin
      .from("ts_attendance")
      .update({ clock_in_at: finalClockIn, clock_out_at: finalClockOut, status: "CORRECTED" })
      .eq("id", attendanceId);
  } else {
    const { data: created } = await admin
      .from("ts_attendance")
      .insert({
        employee_id: request.employee_id,
        work_date: request.work_date,
        status: "CORRECTED",
        clock_in_at: finalClockIn,
        clock_out_at: finalClockOut,
      })
      .select("id")
      .single();
    attendanceId = created?.id ?? null;
  }

  await admin
    .from("ts_attendance_correction_requests")
    .update({ status: "APPROVED", attendance_id: attendanceId })
    .eq("id", requestId);

  await admin.from("ts_attendance_correction_audits").insert({
    request_id: requestId,
    admin_id: adminId,
    action: "APPROVED",
    admin_comment: adminComment,
    original_clock_in_at: originalClockIn,
    original_clock_out_at: originalClockOut,
    final_clock_in_at: finalClockIn,
    final_clock_out_at: finalClockOut,
  });

  await admin.from("ts_attendance_events").insert({
    employee_id: request.employee_id,
    attendance_id: attendanceId,
    event_type: "CORRECTION_APPROVED",
    metadata: { request_id: requestId, admin_id: adminId },
  });

  revalidatePath("/admin/corrections");
  revalidatePath(`/admin/employees/${request.employee_id}`);
}

export async function rejectCorrection(_prevState: SimpleActionState, formData: FormData): Promise<SimpleActionState> {
  let adminId: string;
  try {
    adminId = await assertHr();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized." };
  }

  const requestId = String(formData.get("request_id") || "");
  const adminComment = String(formData.get("admin_comment") || "").trim() || null;
  if (!requestId) return { error: "Missing request." };

  const admin = createAdminClient();
  const { data: request } = await admin.from("ts_attendance_correction_requests").select("*").eq("id", requestId).single();
  if (!request) return { error: "Request not found." };
  if (request.status !== "PENDING") return { error: "This request has already been decided." };

  let originalClockIn: string | null = null;
  let originalClockOut: string | null = null;

  if (request.attendance_id) {
    const { data: existingAttendance } = await admin
      .from("ts_attendance")
      .select("clock_in_at, clock_out_at, status")
      .eq("id", request.attendance_id)
      .single();
    originalClockIn = existingAttendance?.clock_in_at ?? null;
    originalClockOut = existingAttendance?.clock_out_at ?? null;

    if (existingAttendance?.status === "PENDING") {
      const { count } = await admin
        .from("ts_attendance_correction_requests")
        .select("id", { count: "exact", head: true })
        .eq("attendance_id", request.attendance_id)
        .eq("status", "PENDING")
        .neq("id", requestId);
      if (!count) {
        await admin.from("ts_attendance").update({ status: "ABSENT" }).eq("id", request.attendance_id);
      }
    }
  }

  await admin.from("ts_attendance_correction_requests").update({ status: "REJECTED" }).eq("id", requestId);

  await admin.from("ts_attendance_correction_audits").insert({
    request_id: requestId,
    admin_id: adminId,
    action: "REJECTED",
    admin_comment: adminComment,
    original_clock_in_at: originalClockIn,
    original_clock_out_at: originalClockOut,
    final_clock_in_at: originalClockIn,
    final_clock_out_at: originalClockOut,
  });

  await admin.from("ts_attendance_events").insert({
    employee_id: request.employee_id,
    attendance_id: request.attendance_id,
    event_type: "CORRECTION_REJECTED",
    metadata: { request_id: requestId, admin_id: adminId },
  });

  revalidatePath("/admin/corrections");
  revalidatePath(`/admin/employees/${request.employee_id}`);
}
