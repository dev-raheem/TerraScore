-- Live presence tracking during an active clock-in session: current-location
-- cache (fast reads for the admin map), append-only location history, the
-- attendance/presence event log, and the geofence evaluation function.
--
-- Presence status is independent of attendance status (see 0009) and has its
-- own vocabulary: IN_OFFICE / OUT_OF_OFFICE / UNCERTAIN (accuracy radius
-- straddles the geofence boundary) / LOCATION_UNAVAILABLE / LOCATION_STALE
-- (the last two are derived at read-time from "no consent"/"no recent ping"
-- rather than stored directly, except UNAVAILABLE is also stored as the
-- resting state before the first ping of a session).

create table if not exists public.ts_employee_current_locations (
  employee_id uuid primary key references public.ts_employees(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  geog geography(point, 4326) generated always as (
    case when latitude is not null and longitude is not null
      then st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
    end
  ) stored,
  accuracy double precision,
  office_id uuid references public.ts_offices(id),
  distance_meters double precision,
  presence_status text not null default 'LOCATION_UNAVAILABLE'
    check (presence_status in ('IN_OFFICE', 'OUT_OF_OFFICE', 'UNCERTAIN', 'LOCATION_UNAVAILABLE', 'LOCATION_STALE')),
  last_movement_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists ts_employee_current_locations_geog_idx
  on public.ts_employee_current_locations using gist (geog);

-- Append-only. Only written when the employee has moved past
-- movement_threshold_meters or enough time has passed since the last row
-- (see submitLocationPing) — this is history for the timeline/route view,
-- not a raw per-ping log.
create table if not exists public.ts_location_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  attendance_id uuid not null references public.ts_attendance(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  geog geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
  ) stored,
  accuracy double precision,
  office_id uuid references public.ts_offices(id),
  distance_meters double precision,
  presence_status text not null
    check (presence_status in ('IN_OFFICE', 'OUT_OF_OFFICE', 'UNCERTAIN', 'LOCATION_UNAVAILABLE', 'LOCATION_STALE')),
  client_recorded_at timestamptz not null,
  server_received_at timestamptz not null default now(),
  source text not null default 'browser_geolocation',
  created_at timestamptz not null default now()
);

create index if not exists ts_location_events_employee_time_idx
  on public.ts_location_events (employee_id, server_received_at desc);

-- Auditable event log: clock in/out, enter/leave office, unavailable/stale/
-- suspicious signals, correction lifecycle. attendance_events are cheap and
-- never throttled (unlike ts_location_events) since they're state
-- transitions, not raw pings.
create table if not exists public.ts_attendance_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.ts_employees(id) on delete cascade,
  attendance_id uuid references public.ts_attendance(id) on delete cascade,
  event_type text not null check (event_type in (
    'CLOCK_IN', 'CLOCK_OUT', 'ENTERED_OFFICE', 'LEFT_OFFICE',
    'LOCATION_UNAVAILABLE', 'LOCATION_STALE', 'SUSPICIOUS_LOCATION',
    'CORRECTION_REQUESTED', 'CORRECTION_APPROVED', 'CORRECTION_REJECTED'
  )),
  occurred_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  distance_meters double precision,
  office_id uuid references public.ts_offices(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ts_attendance_events_employee_time_idx
  on public.ts_attendance_events (employee_id, occurred_at desc);

-- Single source of truth for "how far is this point from that office, and
-- what does that mean" — used by every Server Action that records a
-- location so the accuracy-aware UNCERTAIN logic lives in exactly one place.
-- Accounts for GPS accuracy: only claims IN_OFFICE/OUT_OF_OFFICE when the
-- accuracy radius doesn't straddle the geofence boundary.
create or replace function public.ts_evaluate_geofence(
  p_lat double precision,
  p_lng double precision,
  p_accuracy double precision,
  p_office_id uuid
)
returns table (distance_meters double precision, presence_status text)
language plpgsql
stable
as $$
declare
  v_office public.ts_offices%rowtype;
  v_distance double precision;
  v_margin double precision;
begin
  if p_lat is null or p_lng is null or p_office_id is null then
    return query select null::double precision, 'LOCATION_UNAVAILABLE'::text;
    return;
  end if;

  select * into v_office from public.ts_offices where id = p_office_id;
  if not found then
    return query select null::double precision, 'LOCATION_UNAVAILABLE'::text;
    return;
  end if;

  v_distance := st_distance(
    v_office.geog,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
  );
  v_margin := coalesce(p_accuracy, 0);

  if v_distance + v_margin <= v_office.radius_meters then
    return query select v_distance, 'IN_OFFICE'::text;
  elsif v_distance - v_margin > v_office.radius_meters then
    return query select v_distance, 'OUT_OF_OFFICE'::text;
  else
    return query select v_distance, 'UNCERTAIN'::text;
  end if;
end;
$$;

alter table public.ts_employee_current_locations enable row level security;
alter table public.ts_location_events enable row level security;
alter table public.ts_attendance_events enable row level security;

create policy "Employees can view own current location" on public.ts_employee_current_locations
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all current locations" on public.ts_employee_current_locations
  for select to authenticated using (public.ts_current_role() = 'hr');

create policy "Employees can view own location history" on public.ts_location_events
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all location history" on public.ts_location_events
  for select to authenticated using (public.ts_current_role() = 'hr');

create policy "Employees can view own attendance events" on public.ts_attendance_events
  for select to authenticated using (employee_id = auth.uid());
create policy "HR can view all attendance events" on public.ts_attendance_events
  for select to authenticated using (public.ts_current_role() = 'hr');

-- No insert/update/delete policies — every write happens inside
-- submitLocationPing/clockIn/clockOut Server Actions using the service-role key.
