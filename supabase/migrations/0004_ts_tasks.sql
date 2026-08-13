-- HR-assigned work items. HR creates a task with a scoring weight, the
-- employee marks it complete, HR reviews it and enters a score — reviewed
-- tasks then feed into syncEmployeeAggregates alongside KPIs. Same
-- visibility pattern as ts_kpis: self or HR can read, all writes (including
-- the employee's own "mark complete") happen server-side with the
-- service-role key.

create table if not exists public.ts_tasks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  assigned_by uuid references public.ts_employees(id) on delete set null,
  title text not null,
  description text,
  weight int not null check (weight between 0 and 100),
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'completed', 'reviewed')),
  score int check (score between 0 and 100),
  employee_note text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ts_tasks enable row level security;

create policy "Employees can view own tasks" on public.ts_tasks
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all tasks" on public.ts_tasks
  for select to authenticated using (public.ts_current_role() = 'hr');
