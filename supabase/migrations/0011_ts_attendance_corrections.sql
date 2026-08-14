-- Attendance correction workflow: employees request a fix, HR approves or
-- rejects. ts_attendance rows are never silently edited — every approval
-- writes an immutable audit row recording the original and final values.
-- Also adds a minimal access-audit table for HR viewing an employee's
-- precise location history (privacy requirement: track who looked, not just
-- who can look).

create table if not exists public.ts_attendance_correction_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  attendance_id uuid references public.ts_attendance(id) on delete cascade,
  work_date date not null,
  request_type text not null
    check (request_type in ('FORGOT_CLOCK_IN', 'FORGOT_CLOCK_OUT', 'WRONG_TIME', 'OTHER')),
  requested_clock_in_at timestamptz,
  requested_clock_out_at timestamptz,
  reason text not null,
  comment text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ts_correction_requests_employee_idx
  on public.ts_attendance_correction_requests (employee_id, created_at desc);
create index if not exists ts_correction_requests_status_idx
  on public.ts_attendance_correction_requests (status) where status = 'PENDING';

-- Immutable decision record. original_/final_ columns capture the
-- attendance row's clock in/out at decision time so the audit trail stands
-- on its own even if ts_attendance is queried or changed again later.
create table if not exists public.ts_attendance_correction_audits (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.ts_attendance_correction_requests(id) on delete cascade,
  admin_id uuid not null references public.ts_employees(id),
  action text not null check (action in ('APPROVED', 'REJECTED')),
  admin_comment text,
  original_clock_in_at timestamptz,
  original_clock_out_at timestamptz,
  final_clock_in_at timestamptz,
  final_clock_out_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ts_correction_audits_request_idx
  on public.ts_attendance_correction_audits (request_id);

create table if not exists public.ts_location_access_audit (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.ts_employees(id),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists ts_location_access_audit_employee_idx
  on public.ts_location_access_audit (employee_id, viewed_at desc);

alter table public.ts_attendance_correction_requests enable row level security;
alter table public.ts_attendance_correction_audits enable row level security;
alter table public.ts_location_access_audit enable row level security;

create policy "Employees can view own correction requests" on public.ts_attendance_correction_requests
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all correction requests" on public.ts_attendance_correction_requests
  for select to authenticated using (public.ts_current_role() = 'hr');

create policy "Employees can view audits of their own requests" on public.ts_attendance_correction_audits
  for select to authenticated using (
    exists (
      select 1 from public.ts_attendance_correction_requests r
      where r.id = request_id and r.employee_id = auth.uid()
    )
  );
create policy "HR can view all correction audits" on public.ts_attendance_correction_audits
  for select to authenticated using (public.ts_current_role() = 'hr');

-- Location access audit is HR/compliance-only — an employee doesn't need to
-- see who on the HR team looked, only that it's logged.
create policy "HR can view the location access audit" on public.ts_location_access_audit
  for select to authenticated using (public.ts_current_role() = 'hr');

-- No insert/update/delete policies — requests, approvals/rejections, and
-- access-audit rows are all written server-side with the service-role key.
