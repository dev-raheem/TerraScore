import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LeaderboardEntry = {
  employee_id: string;
  full_name: string;
  department: string | null;
  overall_score: number;
  badge_icon: string | null;
  badge_title: string | null;
};

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ts_leaderboard")
    .select("*")
    .order("overall_score", { ascending: false })
    .order("full_name", { ascending: true });

  return (data ?? []) as LeaderboardEntry[];
}
