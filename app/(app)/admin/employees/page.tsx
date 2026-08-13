import type { Metadata } from "next";
import { requireHr } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/session";
import AddEmployeeForm from "./AddEmployeeForm";
import PendingApprovalRow from "./PendingApprovalRow";
import EmployeeTable from "./EmployeeTable";

export const metadata: Metadata = { title: "Manage Employees" };

export default async function AdminEmployeesPage() {
  await requireHr();

  const supabase = await createClient();
  const { data } = await supabase
    .from("ts_employees")
    .select("*")
    .order("created_at", { ascending: false });

  const employees = (data ?? []) as Employee[];
  const pending = employees.filter((e) => e.status === "pending");

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Manage Employees</div>
          <div className="page-sub">All employee accounts · {employees.length} total</div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card pad-lg enter" style={{ marginBottom: 22, border: "1px solid var(--gold)" }}>
          <div className="bold" style={{ marginBottom: 12 }}>
            Pending approvals <span className="pill pill-gold">{pending.length}</span>
          </div>
          <div className="tiny muted" style={{ marginBottom: 14 }}>
            These people signed themselves up — approve to give them dashboard access, or reject to delete the request.
          </div>
          {pending.map((e) => (
            <PendingApprovalRow
              key={e.id}
              id={e.id}
              fullName={e.full_name}
              email={e.email}
              meta={[e.department, e.designation].filter(Boolean).join(" · ") || "No department set"}
            />
          ))}
        </div>
      )}

      <AddEmployeeForm />

      <EmployeeTable employees={employees} />
    </>
  );
}
