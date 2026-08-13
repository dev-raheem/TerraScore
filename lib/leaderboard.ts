import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LeaderboardEntry = {
  employee_id: string;
  full_name: string;
  department: string | null;
  overall_score: number;
  badge_icon: string | null;
  badge_title: string | null;
};

export type EomTeaser = {
  employee_id: string;
  full_name: string;
  department: string | null;
  badge_icon: string | null;
  badge_title: string | null;
};

export type EomHistoryEntry = {
  month: string;
  employee_id: string;
  full_name: string;
  department: string | null;
  badge_title: string | null;
};

// Full, score-bearing leaderboard. RLS on ts_leaderboard only lets an
// employee read their own row and lets HR read everyone's — this uses the
// service-role key to read every row regardless, because pages still need
// the whole list server-side to compute a caller's own rank. Callers MUST
// NOT render another employee's overall_score to a non-HR viewer.
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ts_leaderboard")
    .select("*")
    .order("overall_score", { ascending: false })
    .order("full_name", { ascending: true });

  return (data ?? []) as LeaderboardEntry[];
}

// Name/department/badge of the current top scorer only — no score column.
// Safe for every authenticated employee, not just HR, as a motivational
// "who is Employee of the Month" teaser.
export async function getEomTeaser(): Promise<EomTeaser | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("ts_current_eom");
  return (data?.[0] as EomTeaser | undefined) ?? null;
}

export async function getEomHistory(): Promise<EomHistoryEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("ts_eom_history");
  return (data ?? []) as EomHistoryEntry[];
}
