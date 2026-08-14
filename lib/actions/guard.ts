import "server-only";
import { createClient } from "@/lib/supabase/server";

// Server Actions must check this themselves — a Proxy matcher or hidden nav
// item is not a security boundary on its own.
export async function assertHr(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: employee } = await supabase.from("ts_employees").select("role").eq("id", user.id).single();
  if (employee?.role !== "hr") throw new Error("Not authorized.");

  return user.id;
}

// For self-service actions (clock in/out, location pings, correction
// requests): the employee id always comes from the session, never from
// client-supplied form data, so there's no separate "self or HR" check to
// get wrong — the action can only ever act on the caller's own row.
export async function requireEmployeeId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  return user.id;
}
