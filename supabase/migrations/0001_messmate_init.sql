-- ============================================================================
-- MESSMATE · 0001 initial schema
--
-- Run once on a fresh Supabase project:
--   • SQL Editor → paste & run, or
--   • npx supabase db push (with the Supabase CLI linked to your project)
--
-- Entities: messes, profiles, menus, ratings, feedback, reports
-- Security: every table has RLS enabled; students read their own mess data and
--           their own submissions, administrators read everything for the mess.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'admin');
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner');
create type public.report_category as enum ('delay', 'cleanliness', 'quality', 'other');
create type public.report_status as enum ('open', 'in_progress', 'resolved');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- A mess is the unit everything hangs off, so the app can grow from one
-- hostel mess to many without a schema change.
create table public.messes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  address text,
  created_at timestamptz not null default now()
);

-- One profile per auth user. Created automatically by the trigger below.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role public.user_role not null default 'student',
  mess_id uuid references public.messes (id) on delete set null,
  created_at timestamptz not null default now()
);

-- One row per mess, per date, per meal.
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  mess_id uuid not null references public.messes (id) on delete cascade,
  date date not null,
  meal_type public.meal_type not null,
  items text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint menus_one_per_slot unique (mess_id, date, meal_type)
);

-- A student gets one rating per meal; they can change it later (upsert).
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  menu_id uuid not null references public.menus (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  constraint ratings_one_per_student_meal unique (user_id, menu_id)
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  menu_id uuid not null references public.menus (id) on delete cascade,
  comment text not null check (length(btrim(comment)) > 0),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mess_id uuid not null references public.messes (id) on delete cascade,
  category public.report_category not null,
  description text not null check (length(btrim(description)) > 0),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);

create index menus_mess_date_idx on public.menus (mess_id, date desc);
create index ratings_menu_idx on public.ratings (menu_id);
create index ratings_user_idx on public.ratings (user_id);
create index feedback_menu_idx on public.feedback (menu_id);
create index feedback_created_idx on public.feedback (created_at desc);
create index reports_mess_status_idx on public.reports (mess_id, status, created_at desc);
create index reports_user_idx on public.reports (user_id);
create index profiles_mess_idx on public.profiles (mess_id);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so policies never recurse into profiles)
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.current_mess_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select mess_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Every new auth user gets a student profile, linked to the first mess.
-- Role is always 'student': administrators are promoted by an operator,
-- never by a self-service signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_mess uuid;
begin
  select id into default_mess from public.messes order by created_at asc limit 1;

  insert into public.profiles (id, name, role, mess_id)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    'student',
    default_mess
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Students may edit their own name, but only admins can move a profile
-- between roles or messes. Trusted server-side callers (service role key,
-- SQL editor, seed script) have no auth.uid() and are allowed through.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.mess_id is distinct from old.mess_id then
    raise exception 'Only an administrator can change role or mess assignment'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row
  execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.messes enable row level security;
alter table public.profiles enable row level security;
alter table public.menus enable row level security;
alter table public.ratings enable row level security;
alter table public.feedback enable row level security;
alter table public.reports enable row level security;

-- messes -------------------------------------------------------------------
create policy "messes: read own mess or admin"
  on public.messes for select to authenticated
  using (public.is_admin() or id = public.current_mess_id());

create policy "messes: admin insert"
  on public.messes for insert to authenticated
  with check (public.is_admin());

create policy "messes: admin update"
  on public.messes for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "messes: admin delete"
  on public.messes for delete to authenticated
  using (public.is_admin());

-- profiles -----------------------------------------------------------------
create policy "profiles: read own or admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles: update own or admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- profiles are inserted by the auth trigger only; no client insert policy.

-- menus --------------------------------------------------------------------
create policy "menus: read own mess or admin"
  on public.menus for select to authenticated
  using (public.is_admin() or mess_id = public.current_mess_id());

create policy "menus: admin insert"
  on public.menus for insert to authenticated
  with check (public.is_admin());

create policy "menus: admin update"
  on public.menus for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "menus: admin delete"
  on public.menus for delete to authenticated
  using (public.is_admin());

-- ratings ------------------------------------------------------------------
create policy "ratings: student inserts own for own mess"
  on public.ratings for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.menus m
      where m.id = menu_id and m.mess_id = public.current_mess_id()
    )
  );

create policy "ratings: read own or admin"
  on public.ratings for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "ratings: update own"
  on public.ratings for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "ratings: delete own"
  on public.ratings for delete to authenticated
  using (user_id = auth.uid());

-- feedback -----------------------------------------------------------------
create policy "feedback: student inserts own for own mess"
  on public.feedback for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.menus m
      where m.id = menu_id and m.mess_id = public.current_mess_id()
    )
  );

create policy "feedback: read own or admin"
  on public.feedback for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "feedback: delete own"
  on public.feedback for delete to authenticated
  using (user_id = auth.uid());

-- reports ------------------------------------------------------------------
create policy "reports: student inserts own"
  on public.reports for insert to authenticated
  with check (
    user_id = auth.uid()
    and mess_id = public.current_mess_id()
  );

create policy "reports: read own or admin"
  on public.reports for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Only the administrator triages reports (open → in_progress → resolved).
create policy "reports: admin updates status"
  on public.reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants (RLS still applies on top of these)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.messes,
  public.profiles,
  public.menus,
  public.ratings,
  public.feedback,
  public.reports
to authenticated;
