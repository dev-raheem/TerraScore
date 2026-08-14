import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";

const POLICY_ID = "00000000-0000-0000-0000-000000000001";

// Purges raw location history past the configured retention window (see
// ts_attendance_policies.location_retention_days). Only ts_location_events —
// attendance rows and the audit trail are kept per HR/compliance policy, not
// this cron.
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: policy } = await admin
    .from("ts_attendance_policies")
    .select("location_retention_days")
    .eq("id", POLICY_ID)
    .single();
  const retentionDays = policy?.location_retention_days ?? 90;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const { error, count } = await admin
    .from("ts_location_events")
    .delete({ count: "exact" })
    .lt("server_received_at", cutoff.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
