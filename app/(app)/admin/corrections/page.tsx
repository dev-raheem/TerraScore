import type { Metadata } from "next";
import Link from "next/link";
import { requireHr } from "@/lib/session";
import { getPendingCorrections } from "@/lib/attendance";
import { formatDateTimeInZone } from "@/lib/geofence";
import CorrectionDecisionForm from "@/components/attendance/CorrectionDecisionForm";

export const metadata: Metadata = { title: "Corrections" };

export default async function AdminCorrectionsPage() {
  await requireHr();
  const pending = await getPendingCorrections();

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Attendance Corrections</div>
          <div className="page-sub">Pending requests awaiting review · {pending.length} pending</div>
        </div>
      </div>

      <div className="card pad-lg enter">
        {pending.length === 0 && <div className="tiny muted">No pending correction requests.</div>}
        <div className="flex col gap10">
          {pending.map((request) => (
            <div key={request.id} className="card-flat pad" style={{ display: "grid", gap: 8 }}>
              <div className="flex between center" style={{ flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Link href={`/admin/employees/${request.employee_id}`} className="bold small">
                    {request.full_name}
                  </Link>
                  <div className="tiny muted">{request.department ?? "—"} · {request.work_date}</div>
                </div>
                <span className="pill pill-gold tiny">{request.request_type.replaceAll("_", " ")}</span>
              </div>
              <div className="tiny">{request.reason}</div>
              {request.comment && <div className="tiny muted">Comment: {request.comment}</div>}
              {(request.requested_clock_in_at || request.requested_clock_out_at) && (
                <div className="tiny muted">
                  Requested: {formatDateTimeInZone(request.requested_clock_in_at, "Asia/Kolkata")} →{" "}
                  {formatDateTimeInZone(request.requested_clock_out_at, "Asia/Kolkata")}
                </div>
              )}
              <CorrectionDecisionForm requestId={request.id} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
