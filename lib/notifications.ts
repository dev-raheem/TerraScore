import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getUnreadNotificationCount(employeeId: string): Promise<number> {
  const supabase = await createClient();
  const [{ data: visible }, { data: reads }] = await Promise.all([
    supabase.from("ts_notifications").select("id").or(`audience.eq.all,employee_id.eq.${employeeId}`),
    supabase.from("ts_notification_reads").select("notification_id").eq("employee_id", employeeId),
  ]);

  const readIds = new Set((reads ?? []).map((r) => r.notification_id as string));
  return (visible ?? []).filter((n) => !readIds.has(n.id as string)).length;
}
