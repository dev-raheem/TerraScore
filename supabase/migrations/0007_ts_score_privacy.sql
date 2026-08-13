-- Scores are sensitive: only HR and the employee themselves should be able
-- to read anyone's overall/quiz score. The "public leaderboard" tables were
-- previously readable by any authenticated user (using (true)) so every
-- employee could see everyone else's score — tighten those to the same
-- self-or-HR pattern used everywhere else in this schema.
--
-- The one exception employees still need is "who is Employee of the Month" —
-- purely as a motivational teaser, with no score attached. That's served by
-- two security-definer functions below that expose name/department/badge
-- only, never the underlying score column.

drop policy if exists "Anyone authenticated can view the public leaderboard" on public.ts_leaderboard;
create policy "Employees can view own leaderboard row" on public.ts_leaderboard
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all leaderboard rows" on public.ts_leaderboard
  for select to authenticated using (public.ts_current_role() = 'hr');

drop policy if exists "Anyone authenticated can view EOM winners" on public.ts_eom_winners;
create policy "Employees can view own EOM wins" on public.ts_eom_winners
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all EOM winners" on public.ts_eom_winners
  for select to authenticated using (public.ts_current_role() = 'hr');

drop policy if exists "Anyone authenticated can view the quiz leaderboard" on public.ts_quiz_leaderboard;
create policy "Employees can view own quiz leaderboard row" on public.ts_quiz_leaderboard
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all quiz leaderboard rows" on public.ts_quiz_leaderboard
  for select to authenticated using (public.ts_current_role() = 'hr');

-- security definer (like ts_current_role) so this ignores the row filters
-- above and returns the current top scorer's name/department/badge to
-- every authenticated employee — no score column exposed.
create or replace function public.ts_current_eom()
returns table (
  employee_id uuid,
  full_name text,
  department text,
  badge_icon text,
  badge_title text
)
language sql
security definer
set search_path = public
stable
as $$
  select employee_id, full_name, department, badge_icon, badge_title
  from public.ts_leaderboard
  order by overall_score desc, full_name asc
  limit 1;
$$;

grant execute on function public.ts_current_eom() to authenticated;

create or replace function public.ts_eom_history()
returns table (
  month date,
  employee_id uuid,
  full_name text,
  department text,
  badge_title text
)
language sql
security definer
set search_path = public
stable
as $$
  select month, employee_id, full_name, department, badge_title
  from public.ts_eom_winners
  order by month desc
  limit 5;
$$;

grant execute on function public.ts_eom_history() to authenticated;
