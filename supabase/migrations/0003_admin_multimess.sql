-- ============================================================================
-- MESSMATE · 0003 admin console + multi-mess discovery
--
-- Run after 0001 and 0002:
--   • SQL Editor → paste & run, or
--   • npx supabase db push
--
-- Adds what the two new modules need:
--   1. messes.price_per_meal — the headline price shown on discovery screens
--   2. a public mess directory: anonymous visitors may read messes + menus,
--      but ratings and comments only ever leave the database aggregated or
--      anonymised (the functions below), so no student's identity leaks
--   3. deterministic default-mess assignment now that there is more than one
--      mess to attach a fresh signup to
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Price per meal (rupees) on the mess itself
--
-- One number per mess keeps the directory sortable and the comparison table
-- honest; the admin maintains it while editing the mess.
-- ---------------------------------------------------------------------------
alter table public.messes
  add column if not exists price_per_meal numeric(7, 2);

alter table public.messes
  add constraint messes_price_range check (
    price_per_meal is null or (price_per_meal >= 0 and price_per_meal <= 10000)
  );

comment on column public.messes.price_per_meal is
  'Flat mess rate for one meal, in rupees. Shown on /messes and used for sorting.';

-- ---------------------------------------------------------------------------
-- 2. Public mess directory
--
-- The directory is a discovery surface, so it is readable without a session.
-- Only `messes` and `menus` become public; profiles, ratings, feedback and
-- reports keep their existing policies. A student can therefore see any mess's
-- menu, but never another student's rating, comment or report.
-- ---------------------------------------------------------------------------
drop policy if exists "messes: read own mess or admin" on public.messes;

create policy "messes: public directory read"
  on public.messes for select to public
  using (true);

drop policy if exists "menus: read own mess or admin" on public.menus;

create policy "menus: public menu read"
  on public.menus for select to public
  using (true);

-- ---------------------------------------------------------------------------
-- 3. Anonymisation helper
--
-- "Aarav Sharma" → "A. S." Public reviews carry a star count and a comment,
-- never a full name or a user id.
-- ---------------------------------------------------------------------------
create or replace function public.mask_student_name(full_name text)
returns text
language sql
immutable
as $$
  with parts as (
    select string_to_array(
      btrim(coalesce(nullif(btrim(full_name), ''), 'Student')),
      ' '
    ) as names
  )
  select case
    when cardinality(names) > 1
      then left(names[1], 1) || '. ' || left(names[cardinality(names)], 1) || '.'
    else left(names[1], 1) || '.'
  end
  from parts;
$$;

comment on function public.mask_student_name(text) is
  'Initial-only label for publicly shown reviews.';

-- ---------------------------------------------------------------------------
-- 4. Directory aggregates
--
-- One call for the whole /messes page: average stars, how many students rated,
-- how many wrote a comment and how many meals are on right now. Aggregates
-- only — the raw ratings rows never reach an anonymous visitor.
-- ---------------------------------------------------------------------------
create or replace function public.mess_directory_stats(p_mess_ids uuid[])
returns table (
  mess_id uuid,
  avg_stars numeric,
  rating_count bigint,
  comment_count bigint,
  meal_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id as mess_id,
    round(avg(r.stars)::numeric, 2) as avg_stars,
    count(distinct r.id)::bigint as rating_count,
    (
      select count(*)
      from public.feedback f
      join public.menus fm on fm.id = f.menu_id
      where fm.mess_id = m.id
    )::bigint as comment_count,
    (
      select count(*)
      from public.menus sm
      where sm.mess_id = m.id
    )::bigint as meal_count
  from public.messes m
  left join public.menus mn on mn.mess_id = m.id
  left join public.ratings r on r.menu_id = mn.id
  where m.id = any (p_mess_ids)
  group by m.id;
$$;

-- ---------------------------------------------------------------------------
-- 5. Per-mess rating breakdown by meal type, plus the star distribution
-- ---------------------------------------------------------------------------
create or replace function public.mess_rating_breakdown(p_mess_id uuid)
returns table (
  meal_type public.meal_type,
  avg_stars numeric,
  rating_count bigint,
  one_star bigint,
  two_star bigint,
  three_star bigint,
  four_star bigint,
  five_star bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mn.meal_type,
    round(avg(r.stars)::numeric, 2) as avg_stars,
    count(*)::bigint as rating_count,
    count(*) filter (where r.stars = 1)::bigint,
    count(*) filter (where r.stars = 2)::bigint,
    count(*) filter (where r.stars = 3)::bigint,
    count(*) filter (where r.stars = 4)::bigint,
    count(*) filter (where r.stars = 5)::bigint
  from public.ratings r
  join public.menus mn on mn.id = r.menu_id
  where mn.mess_id = p_mess_id
  group by mn.meal_type
  order by mn.meal_type;
$$;

-- ---------------------------------------------------------------------------
-- 6. Recent public reviews (masked author, capped limit)
-- ---------------------------------------------------------------------------
create or replace function public.mess_recent_reviews(
  p_mess_id uuid,
  p_limit integer default 6
)
returns table (
  created_at timestamptz,
  stars smallint,
  comment text,
  meal_type public.meal_type,
  menu_date date,
  author_label text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    f.created_at,
    r.stars,
    left(f.comment, 280) as comment,
    mn.meal_type,
    mn.date as menu_date,
    public.mask_student_name(p.name) as author_label
  from public.feedback f
  join public.menus mn on mn.id = f.menu_id
  join public.profiles p on p.id = f.user_id
  left join public.ratings r
    on r.user_id = f.user_id and r.menu_id = f.menu_id
  where mn.mess_id = p_mess_id
  order by f.created_at desc
  limit least(greatest(coalesce(p_limit, 6), 1), 12);
$$;

revoke all on function public.mess_directory_stats(uuid[]) from public;
revoke all on function public.mess_rating_breakdown(uuid) from public;
revoke all on function public.mess_recent_reviews(uuid, integer) from public;
revoke all on function public.mask_student_name(text) from public;

grant execute on function public.mess_directory_stats(uuid[]) to anon, authenticated;
grant execute on function public.mess_rating_breakdown(uuid) to anon, authenticated;
grant execute on function public.mess_recent_reviews(uuid, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Fresh signups land in the oldest mess, deterministically
--
-- With several messes seeded, created_at ties are possible; ordering by name
-- after created_at keeps the choice reproducible.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_mess uuid;
begin
  select id into default_mess
  from public.messes
  order by created_at asc, name asc
  limit 1;

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

-- ---------------------------------------------------------------------------
-- 8. Indexes for the new access patterns
-- ---------------------------------------------------------------------------
create index if not exists messes_price_idx on public.messes (price_per_meal);
create index if not exists menus_mess_date_meal_idx
  on public.menus (mess_id, date desc, meal_type);
