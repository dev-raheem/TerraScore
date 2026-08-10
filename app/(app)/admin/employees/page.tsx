import Link from "next/link";
import { requireHr } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/session";
import AddEmployeeForm from "./AddEmployeeForm";
import { approveEmployee, rejectEmployee } from "./actions";

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
            <div
              key={e.id}
              className="flex between center"
              style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}
            >
              <div>
                <div className="bold small">{e.full_name}</div>
                <div className="tiny muted">
                  {e.email} · {[e.department, e.designation].filter(Boolean).join(" · ") || "No department set"}
                </div>
              </div>
              <div className="flex gap8">
                <form
                  action={async (formData) => {
                    "use server";
                    await approveEmployee(formData);
                  }}
                >
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Approve
                  </button>
                </form>
                <form
                  action={async (formData) => {
                    "use server";
                    await rejectEmployee(formData);
                  }}
                >
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="btn btn-outline btn-sm">
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEmployeeForm />

      <div className="card pad-lg enter enter-d1" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Employee code</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Role</th>
              <th>Status</th>
              <th>Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="row-hover">
                <td className="bold">{e.full_name}</td>
                <td className="mono small">{e.employee_code ?? "—"}</td>
                <td className="small">{e.email}</td>
                <td className="small">{e.department ?? "—"}</td>
                <td className="small">{e.designation ?? "—"}</td>
                <td>
                  <span className={`pill ${e.role === "hr" ? "pill-gold" : "pill-primary"}`}>{e.role}</span>
                </td>
                <td>
                  {e.status === "pending" ? (
                    <span className="pill pill-gold">Awaiting approval</span>
                  ) : e.must_change_password ? (
                    <span className="pill pill-coral">Pending first login</span>
                  ) : (
                    <span className="pill pill-emerald">Active</span>
                  )}
                </td>
                <td className="mono bold">{e.overall_score}</td>
                <td>
                  <Link href={`/admin/employees/${e.id}`} className="btn btn-outline btn-sm">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={9} className="muted small" style={{ padding: 20, textAlign: "center" }}>
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
