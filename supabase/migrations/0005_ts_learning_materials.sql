-- Learning & Development resources: HR-uploaded materials organized by
-- category, shown as the "Resources" cards on /learning. Each row is either
-- a file in the private learning-materials bucket (storage_path) or an
-- external link (external_url), never both — bucket is private, so files
-- are only ever reached through a service-role-generated signed URL.

create table if not exists public.ts_learning_materials (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('video', 'sop', 'pdf', 'template', 'policy')),
  title text not null,
  description text,
  external_url text,
  storage_path text,
  uploaded_by uuid references public.ts_employees(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ts_learning_materials_one_source check (
    (external_url is not null) <> (storage_path is not null)
  )
);

alter table public.ts_learning_materials enable row level security;

create policy "Employees can view learning materials" on public.ts_learning_materials
  for select to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('learning-materials', 'learning-materials', false)
on conflict (id) do nothing;
