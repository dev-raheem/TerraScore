-- KPIs, KRAs, badges, monthly score history, and a public leaderboard
-- projection. All private tables follow the same pattern as ts_employees:
-- self or HR can read, all writes happen server-side with the service-role key.

create extension if not exists pgcrypto;

alter table public.ts_employees
  add column if not exists overall_score int not null default 0,
  add column if not exists current_badge_id uuid;

create table if not exists public.ts_kpis (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  name text not null,
  score int not null check (score between 0 and 100),
  weight int not null check (weight between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ts_kras (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  name text not null,
  target text not null,
  achieved text not null,
  pct int not null check (pct between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ts_badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null,
  description text not null
);

alter table public.ts_employees
  add constraint ts_employees_current_badge_id_fkey
  foreign key (current_badge_id) references public.ts_badges(id);

create table if not exists public.ts_employee_badges (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  badge_id uuid not null references public.ts_badges(id) on delete cascade,
  awarded_at date not null default current_date,
  unique (employee_id, badge_id)
);

create table if not exists public.ts_monthly_scores (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  month date not null,
  score int not null check (score between 0 and 100),
  badge_label text,
  created_at timestamptz not null default now(),
  unique (employee_id, month)
);

-- Public projection kept in sync by server actions (service-role key) whenever
-- KPIs or badges change — lets every employee see the company leaderboard
-- without granting broad read access to anyone's raw KPI/KRA breakdown.
create table if not exists public.ts_leaderboard (
  employee_id uuid primary key references public.ts_employees(id) on delete cascade,
  full_name text not null,
  department text,
  overall_score int not null default 0,
  badge_icon text,
  badge_title text,
  updated_at timestamptz not null default now()
);

-- Public history of each month's top scorer, snapshotted whenever HR records
-- a monthly score (see recordMonthlySnapshot). Kept separate from
-- ts_monthly_scores (which is per-employee and private) since "who won which
-- month" is company-wide public info, same as the leaderboard.
create table if not exists public.ts_eom_winners (
  month date primary key,
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  full_name text not null,
  department text,
  score int not null,
  badge_title text
);

alter table public.ts_kpis enable row level security;
alter table public.ts_kras enable row level security;
alter table public.ts_badges enable row level security;
alter table public.ts_employee_badges enable row level security;
alter table public.ts_monthly_scores enable row level security;
alter table public.ts_leaderboard enable row level security;
alter table public.ts_eom_winners enable row level security;

create policy "Employees can view own kpis" on public.ts_kpis
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all kpis" on public.ts_kpis
  for select to authenticated using (public.ts_current_role() = 'hr');

create policy "Employees can view own kras" on public.ts_kras
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all kras" on public.ts_kras
  for select to authenticated using (public.ts_current_role() = 'hr');

create policy "Anyone authenticated can view the badge catalog" on public.ts_badges
  for select to authenticated using (true);

create policy "Employees can view own earned badges" on public.ts_employee_badges
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all earned badges" on public.ts_employee_badges
  for select to authenticated using (public.ts_current_role() = 'hr');

create policy "Employees can view own monthly scores" on public.ts_monthly_scores
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all monthly scores" on public.ts_monthly_scores
  for select to authenticated using (public.ts_current_role() = 'hr');

create policy "Anyone authenticated can view the public leaderboard" on public.ts_leaderboard
  for select to authenticated using (true);

create policy "Anyone authenticated can view EOM winners" on public.ts_eom_winners
  for select to authenticated using (true);

-- No insert/update/delete policies anywhere above — HR admin Server Actions
-- perform all writes with the service-role key, and keep ts_employees'
-- overall_score/current_badge_id and ts_leaderboard in sync at the same time.

insert into public.ts_badges (name, icon, description) values
  ('Team Player', '🤝', 'Consistently supports teammates across projects'),
  ('Best Learner', '📚', 'Highest L&D completion rate this quarter'),
  ('Perfect Attendance', '⏱️', 'Zero unplanned absences for 6 months'),
  ('Fast Performer', '⭐', 'Top 10% turnaround time on assigned tasks'),
  ('Quality Champion', '✅', 'Above 95% quality score, 3 months running'),
  ('Growth Champion', '📈', 'Largest month-on-month score improvement'),
  ('Best Communicator', '🗣️', 'Clear, proactive updates to stakeholders'),
  ('Top Problem Solver', '🧩', 'Resolved the most escalations cleanly'),
  ('Highest Improvement', '🚀', 'Biggest jump in overall score this month')
on conflict (name) do nothing;
