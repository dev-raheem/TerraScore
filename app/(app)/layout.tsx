import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const employee = await getCurrentEmployee();

  if (!employee) redirect("/login");
  if (employee.must_change_password) redirect("/change-password");
  if (employee.status === "pending") redirect("/pending-approval");

  const subtitle = employee.role === "hr" ? "HR Admin" : employee.department ?? "";

  return (
    <div className="shell-grid">
      <Sidebar role={employee.role} />
      <div className="main-col">
        <Topbar name={employee.full_name} subtitle={subtitle} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
