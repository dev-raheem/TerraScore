import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/session";
import { signOut } from "@/lib/actions/auth";

export default async function PendingApprovalPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");
  if (employee.status === "active") {
    redirect(employee.role === "hr" ? "/admin" : "/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card pad-lg enter" style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Waiting for HR approval</h1>
        <p className="muted small" style={{ marginBottom: 22 }}>
          Your account, {employee.full_name}, has been created but HR still needs to approve it before you can sign
          in and see your dashboard. Check back soon, or reach out to HR directly.
        </p>
        <form action={signOut}>
          <button type="submit" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
