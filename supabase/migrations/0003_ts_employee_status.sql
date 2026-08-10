-- Lets employees self-signup at /signup. New self-signup rows start out
-- 'pending' and are invisible to the rest of the app (dashboard, leaderboard,
-- login redirect) until HR approves them from Manage Employees. Employees
-- created by HR directly (AddEmployeeForm) default to 'active' since HR is
-- vouching for them at creation time.

alter table public.ts_employees
  add column if not exists status text not null default 'active' check (status in ('pending', 'active'));
