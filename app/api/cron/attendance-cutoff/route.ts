import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalTimeString, getWorkDate } from "@/lib/geofence";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";

const POLICY_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_TIMEZONE = "Asia/Kolkata";

// Runs on a schedule (see vercel.json) but is written to be safe at any
// cadence — Vercel Hobby plans collapse cron frequency to once/day, so the
// correctness here can't depend on being invoked at a precise minute. Each
// run just asks "is it past this office's cutoff today, and does this
// employee still lack valid attendance" — idempotent regardless of how often
// it fires.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const [{ data: employees }, { data: offices }, { data: policy }] = await Promise.all([
    admin.from("ts_employees").select("id, office_id").eq("status", "active"),
    admin.from("ts_offices").select("id, timezone"),
    admin.from("ts_attendance_policies").select("attendance_cutoff_time").eq("id", POLICY_ID).single(),
  ]);

  const timezoneByOffice = new Map((offices ?? []).map((o) => [o.id as string, o.timezone as string]));
  const cutoffTime = policy?.attendance_cutoff_time ?? "11:00:00";

  let markedAbsent = 0;

  for (const employee of employees ?? []) {
    const timezone = (employee.office_id && timezoneByOffice.get(employee.office_id as string)) || DEFAULT_TIMEZONE;
    if (getLocalTimeString(now, timezone) < cutoffTime) continue;

    const workDate = getWorkDate(timezone, now);

    const { data: existing } = await admin
      .from("ts_attendance")
      .select("id, status, clock_in_at")
      .eq("employee_id", employee.id)
      .eq("work_date", workDate)
      .maybeSingle();

    if (existing) {
      // Only a NOT_STARTED day with no clock-in flips to ABSENT — anything
      // else (PRESENT, PENDING from a correction request, ON_LEAVE, already
      // ABSENT) is left alone so this never overwrites a real decision.
      if (!existing.clock_in_at && existing.status === "NOT_STARTED") {
        await admin.from("ts_attendance").update({ status: "ABSENT" }).eq("id", existing.id);
        markedAbsent += 1;
      }
      continue;
    }

    await admin.from("ts_attendance").insert({ employee_id: employee.id, work_date: workDate, status: "ABSENT" });
    markedAbsent += 1;
  }

  return NextResponse.json({ ok: true, markedAbsent });
}
