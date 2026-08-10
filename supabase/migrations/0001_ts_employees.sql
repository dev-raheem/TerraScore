-- TerraScore employee accounts, in the shared TerraRex Supabase project.
-- Prefixed ts_ to stay clearly separate from the main TerraRex app's trx_* tables.
-- Only adds new objects — does not touch any existing table.

create table if not exists public.ts_employees (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  employee_code text unique,
  department text,
  designation text,
  phone text,
  reporting_manager text,
  joining_date date,
  role text not null default 'employee' check (role in ('hr', 'employee')),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.ts_employees enable row level security;

-- security definer so "HR can view all rows" doesn't recurse into RLS on itself
create or replace function public.ts_current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.ts_employees where id = auth.uid();
$$;

create policy "Employees can view own row"
  on public.ts_employees for select
  to authenticated
  using (id = auth.uid());

create policy "HR can view all rows"
  on public.ts_employees for select
  to authenticated
  using (public.ts_current_role() = 'hr');

-- No insert/update/delete policies: all writes happen server-side through
-- Server Actions using the service-role key, which bypasses RLS entirely.
-- This keeps employee creation, password-change flags, and role changes
-- fully controlled by trusted server code.

-- ---------------------------------------------------------------------------
-- Bootstrap: create the first HR account (run once, manually)
-- ---------------------------------------------------------------------------
-- 1. Supabase Dashboard → Authentication → Users → "Add user"
--    - set an email + password
--    - toggle "Auto Confirm User" on
--    - copy the generated user's UUID
-- 2. Run this, substituting the UUID and your own values:
--
-- insert into public.ts_employees
--   (id, full_name, email, employee_code, department, designation, role, must_change_password)
-- values
--   ('<uuid-from-step-1>', 'Your Name', 'hr@terrarexenergy.com', 'HR-0001', 'HR', 'HR Manager', 'hr', false);
