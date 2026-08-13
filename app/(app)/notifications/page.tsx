import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import NotificationRow, { type NotificationRowData } from "./NotificationRow";
import MarkAllReadButton from "./MarkAllReadButton";
import SendNotificationForm, { type EmployeeOption } from "./SendNotificationForm";

export const metadata: Metadata = { title: "Notifications" };

type NotificationJoined = {
  id: string;
  title: string;
  message: string | null;
  audience: "all" | "employee";
  employee_id: string | null;
  created_at: string;
  target: { full_name: string } | { full_name: string }[] | null;
};

export default async function NotificationsPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/login");

  const isHr = employee.role === "hr";
  const supabase = await createClient();

  const [{ data: notificationRows }, { data: readRows }, employeesForDropdown] = await Promise.all([
    supabase
      .from("ts_notifications")
      .select("id, title, message, audience, employee_id, created_at, target:employee_id(full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("ts_notification_reads").select("notification_id").eq("employee_id", employee.id),
    isHr
      ? supabase.from("ts_employees").select("id, full_name").order("full_name").then((r) => (r.data ?? []) as EmployeeOption[])
      : Promise.resolve([] as EmployeeOption[]),
  ]);

  const readIds = new Set((readRows ?? []).map((r) => r.notification_id as string));
  const notifications: NotificationRowData[] = ((notificationRows ?? []) as NotificationJoined[]).map((n) => {
    const target = Array.isArray(n.target) ? n.target[0] : n.target;
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      audience: n.audience,
      targetName: target?.full_name ?? null,
      createdAt: n.created_at,
      isRead: readIds.has(n.id),
    };
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <div className="page-head enter">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-sub">
            {unreadCount === 0 ? "You're all caught up" : `${unreadCount} unread`}
          </div>
        </div>
        <MarkAllReadButton />
      </div>

      {isHr && <SendNotificationForm employees={employeesForDropdown} />}

      <div className="card pad-lg enter enter-d1">
        {notifications.map((n) => (
          <NotificationRow key={n.id} notification={n} isHr={isHr} />
        ))}
        {notifications.length === 0 && (
          <div className="muted small" style={{ padding: 20, textAlign: "center" }}>
            No notifications yet.
          </div>
        )}
      </div>
    </>
  );
}
