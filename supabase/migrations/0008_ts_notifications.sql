-- Real notifications, replacing the hardcoded mock list on /notifications.
-- HR can broadcast to everyone or target one employee; every employee
-- (including HR) sees notifications addressed to them or to "all" and can
-- mark them read. Same visibility pattern as elsewhere: self-or-HR can
-- read, all writes happen server-side with the service-role key.

create table if not exists public.ts_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  audience text not null check (audience in ('all', 'employee')),
  employee_id uuid references public.ts_employees(id) on delete cascade,
  created_by uuid references public.ts_employees(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ts_notifications_target check (
    (audience = 'all' and employee_id is null) or
    (audience = 'employee' and employee_id is not null)
  )
);

create table if not exists public.ts_notification_reads (
  notification_id uuid not null references public.ts_notifications(id) on delete cascade,
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, employee_id)
);

alter table public.ts_notifications enable row level security;
alter table public.ts_notification_reads enable row level security;

create policy "Employees can view their notifications" on public.ts_notifications
  for select to authenticated using (audience = 'all' or employee_id = auth.uid());
create policy "HR can view all notifications" on public.ts_notifications
  for select to authenticated using (public.ts_current_role() = 'hr');

create policy "Employees can view own notification reads" on public.ts_notification_reads
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all notification reads" on public.ts_notification_reads
  for select to authenticated using (public.ts_current_role() = 'hr');

-- No insert/update/delete policies — sending/deleting notifications and
-- marking them read all happen server-side through Server Actions using
-- the service-role key.
