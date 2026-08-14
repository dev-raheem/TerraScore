-- Attendance + office geofencing, phase 1: offices, employee->office assignment,
-- consent flag, daily attendance rows, and org-wide tracking policy.
-- Same pattern as every other ts_ table: self-or-HR can read, all writes
-- happen server-side through Server Actions using the service-role key.
--
-- Attendance (present/absent) and presence (in/out of office, added in the
-- next migration) are deliberately separate concepts — this migration only
-- covers attendance. An employee can be PRESENT while OUT_OF_OFFICE.

create extension if not exists postgis;

create table if not exists public.ts_offices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  geog geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
  ) stored,
  radius_meters double precision not null default 150 check (radius_meters > 0),
  address text,
  timezone text not null default 'Asia/Kolkata',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ts_offices_geog_idx on public.ts_offices using gist (geog);

-- Single current office per employee (mirrors how department/designation are
-- already plain columns, not a separate assignment-history table). Consent is
-- a separate explicit opt-in — clocking in is allowed without it, but live
-- location tracking is not.
alter table public.ts_employees
  add column if not exists office_id uuid references public.ts_offices(id),
  add column if not exists location_tracking_consent_at timestamptz;

create table if not exists public.ts_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  work_date date not null,
  status text not null default 'NOT_STARTED'
    check (status in ('NOT_STARTED', 'PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'PENDING', 'CORRECTED')),
  office_id uuid references public.ts_offices(id),

  clock_in_at timestamptz,
  clock_in_latitude double precision,
  clock_in_longitude double precision,
  clock_in_accuracy double precision,
  clock_in_distance_meters double precision,
  clock_in_geofence_status text
    check (clock_in_geofence_status in ('IN_OFFICE', 'OUT_OF_OFFICE', 'UNCERTAIN', 'LOCATION_UNAVAILABLE')),

  clock_out_at timestamptz,
  clock_out_latitude double precision,
  clock_out_longitude double precision,
  clock_out_accuracy double precision,
  clock_out_distance_meters double precision,
  clock_out_geofence_status text
    check (clock_out_geofence_status in ('IN_OFFICE', 'OUT_OF_OFFICE', 'UNCERTAIN', 'LOCATION_UNAVAILABLE')),

  total_working_seconds int not null default 0,
  total_out_of_office_seconds int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

create index if not exists ts_attendance_employee_date_idx on public.ts_attendance (employee_id, work_date desc);

-- Org-wide tracking/attendance config. Singleton row (fixed id) so app code
-- never has to guess which row is "the" policy; HR-editable later via a
-- Server Action, values only ever changed server-side.
create table if not exists public.ts_attendance_policies (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  normal_interval_seconds int not null default 60,
  high_accuracy_interval_seconds int not null default 30,
  low_battery_interval_seconds int not null default 180,
  movement_threshold_meters double precision not null default 100,
  stale_after_seconds int not null default 900,
  attendance_cutoff_time time not null default '11:00:00',
  location_retention_days int not null default 90,
  updated_at timestamptz not null default now()
);

insert into public.ts_attendance_policies (id) values ('00000000-0000-0000-0000-000000000001'::uuid)
on conflict (id) do nothing;

alter table public.ts_offices enable row level security;
alter table public.ts_attendance enable row level security;
alter table public.ts_attendance_policies enable row level security;

-- Offices are company directory info (like the badge catalog), not personal
-- data — fine for any logged-in employee to see so the consent/attendance UI
-- can show "your office is X, geofence radius Y".
create policy "Anyone authenticated can view offices" on public.ts_offices
  for select to authenticated using (true);

create policy "Employees can view own attendance" on public.ts_attendance
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all attendance" on public.ts_attendance
  for select to authenticated using (public.ts_current_role() = 'hr');

create policy "Anyone authenticated can view attendance policy" on public.ts_attendance_policies
  for select to authenticated using (true);

-- No insert/update/delete policies anywhere above — office management,
-- clock in/out, and policy edits all happen server-side with the
-- service-role key.
