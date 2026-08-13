import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/session";
import { getUnreadNotificationCount } from "@/lib/notifications";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { MobileNavProvider } from "@/components/MobileNavContext";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const employee = await getCurrentEmployee();

  if (!employee) redirect("/login");
  if (employee.must_change_password) redirect("/change-password");
  if (employee.status === "pending") redirect("/pending-approval");

  const subtitle = employee.role === "hr" ? "HR Admin" : employee.department ?? "";
  const unreadNotifications = await getUnreadNotificationCount(employee.id);

  return (
    <MobileNavProvider>
      <div className="shell-grid">
        <Sidebar role={employee.role} />
        <div className="main-col">
          <Topbar name={employee.full_name} subtitle={subtitle} unreadNotifications={unreadNotifications} />
          <main className="content">{children}</main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
